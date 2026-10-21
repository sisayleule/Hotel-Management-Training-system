/**
 * reservationService.js
 *
 * All Supabase CRUD operations for the reservations table.
 * Pages and hooks should import from here — never query supabase directly
 * for reservations outside this file.
 */

import { supabase } from '../lib/supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a raw Supabase row back to the shape the rest of the app expects.
 * The store/UI uses camelCase-ish keys like rooms_assigned (already snake_case),
 * but DATE columns come back as strings from Supabase — no transformation needed.
 */
const mapRow = (row) => ({
  ...row,
  // Ensure arrays are always arrays (Supabase returns null for empty JSONB/TEXT[])
  rooms_assigned: row.rooms_assigned ?? [],
  payments: row.payments ?? [],
});

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all reservations, newest first.
 * @returns {{ data: Array, error: Error|null }}
 */
export const fetchAllReservations = async () => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };
  return { data: data.map(mapRow), error: null };
};

/**
 * Fetch a single reservation by its human-readable number (e.g. "RES001").
 * @param {string} reservationNo
 * @returns {{ data: Object|null, error: Error|null }}
 */
export const fetchReservationByNo = async (reservationNo) => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_no', reservationNo)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data: data ? mapRow(data) : null, error: null };
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new reservation.
 * Calls the next_reservation_no() Postgres function to get a collision-free
 * reservation number, then inserts the row.
 *
 * @param {Object} payload  - Fields matching the reservations table
 * @param {string} userId   - auth.uid() of the currently logged-in user
 * @returns {{ data: Object|null, reservationNo: string|null, error: Error|null }}
 */
export const createReservation = async (payload, userId) => {
  // 1. Get next reservation number from the database (race-condition safe)
  const { data: seqData, error: seqError } = await supabase
    .rpc('next_reservation_no');

  if (seqError) return { data: null, reservationNo: null, error: seqError };

  const reservationNo = seqData;

  // 2. Build the insert row — strip any private UI-only fields
  const {
    _reuseExistingGuest,
    _existingGuestId,
    _forceCreateNewGuest,
    rateCode,      // form field names that differ from DB column names
    roomRate,
    mealPlan,
    discountPercent,
    taxPercent,
    serviceChargePercent,
    ...rest
  } = payload;

  const row = {
    ...rest,
    reservation_no:         reservationNo,
    rate_code:              payload.rate_code  || rateCode  || 'BAR',
    meal_plan:              payload.meal_plan  || mealPlan  || 'RO',
    rate:                   Number(payload.rate  || roomRate  || 0),
    discount_percent:       Number(payload.discount_percent  ?? discountPercent  ?? 0),
    tax_percent:            Number(payload.tax_percent       ?? taxPercent       ?? 0),
    service_charge_percent: Number(payload.service_charge_percent ?? serviceChargePercent ?? 0),
    rooms_assigned:         payload.rooms_assigned || [],
    status:                 payload.status || 'confirmed',
    created_by:             userId || null,
    updated_by:             userId || null,
  };

  const { data, error } = await supabase
    .from('reservations')
    .insert(row)
    .select()
    .single();

  if (error) return { data: null, reservationNo: null, error };
  return { data: mapRow(data), reservationNo, error: null };
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE  (Amend)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update editable fields on an existing reservation (amend).
 *
 * @param {string} reservationNo  - e.g. "RES001"
 * @param {Object} updates        - Only the fields being changed
 * @param {string} userId         - auth.uid()
 * @returns {{ data: Object|null, error: Error|null }}
 */
export const updateReservation = async (reservationNo, updates, userId) => {
  // Strip UI-only / audit fields that should NOT go in the PATCH body.
  // - updated_at  : managed by the DB trigger (sending it causes a 406)
  // - updated_by  : FK → profiles(id); omit to avoid FK violation when the
  //                 column has a NOT NULL constraint or the UUID is stale.
  // - id, created_at, created_by : never overwrite these
  const {
    updated_at,
    updated_by,
    id,
    created_at,
    created_by,
    reservation_no: _rno,   // never update the PK
    payments,               // payments handled separately
    ...safeUpdates
  } = updates;

  const { data, error } = await supabase
    .from('reservations')
    .update(safeUpdates)
    .eq('reservation_no', reservationNo)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: mapRow(data), error: null };
};

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cancel a reservation — sets status to 'cancelled' and records the reason.
 *
 * @param {string} reservationNo
 * @param {string} reason
 * @param {string} userId
 * @returns {{ data: Object|null, error: Error|null }}
 */
export const cancelReservation = async (reservationNo, reason, userId) => {
  const { data, error } = await supabase
    .from('reservations')
    .update({
      status:              'cancelled',
      cancellation_reason: reason || '',
    })
    .eq('reservation_no', reservationNo)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: mapRow(data), error: null };
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN ROOM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assign a room number to a reservation.
 * Replaces (not appends) to keep a single assigned room.
 *
 * @param {string} reservationNo
 * @param {string} roomNo
 * @param {string} userId
 * @returns {{ data: Object|null, error: Error|null }}
 */
export const assignRoomToReservation = async (reservationNo, roomNo, userId) => {
  return updateReservation(reservationNo, { rooms_assigned: [roomNo] }, userId);
};

// ─────────────────────────────────────────────────────────────────────────────
// RELEASE ROOM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove a specific room from a reservation's rooms_assigned array.
 *
 * @param {string} reservationNo
 * @param {string} roomNo
 * @param {string} userId
 * @returns {{ data: Object|null, error: Error|null }}
 */
export const releaseRoomFromReservation = async (reservationNo, roomNo, userId) => {
  // Read current assignment first
  const { data: current, error: fetchError } = await supabase
    .from('reservations')
    .select('rooms_assigned')
    .eq('reservation_no', reservationNo)
    .single();

  if (fetchError) return { data: null, error: fetchError };

  const updated = (current.rooms_assigned ?? []).filter((no) => no !== roomNo);
  return updateReservation(reservationNo, { rooms_assigned: updated }, userId);
};

// ─────────────────────────────────────────────────────────────────────────────
// CHECK-IN / CHECK-OUT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a reservation as checked_in and lock the assigned room.
 *
 * @param {string} reservationNo
 * @param {string} roomNo
 * @param {string} userId
 */
export const checkInReservation = async (reservationNo, roomNo, userId) => {
  return updateReservation(
    reservationNo,
    { status: 'checked_in', rooms_assigned: [roomNo] },
    userId
  );
};

/**
 * Mark a reservation as checked_out.
 *
 * @param {string} reservationNo
 * @param {string} userId
 */
export const checkOutReservation = async (reservationNo, userId) => {
  return updateReservation(reservationNo, { status: 'checked_out' }, userId);
};
