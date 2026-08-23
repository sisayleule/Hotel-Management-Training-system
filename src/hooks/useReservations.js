/**
 * useReservations.js
 *
 * Primary hook for all reservation operations.
 * Writes go to Supabase first, then sync to the local Zustand store so
 * the rest of the UI (room status, statistics, etc.) stays reactive.
 */

import { useState, useCallback } from 'react';
import { useHotelStore } from '../store/useHotelStore.js';
import { useSupabaseAuth } from '../contexts/AuthContext.jsx';
import * as svc from '../services/reservationService.js';

export const useReservations = () => {
  const { user } = useSupabaseAuth();
  const userId = user?.id ?? null;

  // ── Zustand store ──────────────────────────────────────────────────────────
  const reservations        = useHotelStore((s) => s.reservations);
  const storeAddReservation = useHotelStore((s) => s.createReservation);   // local fallback
  const storeUpdateRes      = useHotelStore((s) => s.updateReservation);
  const storeCancelRes      = useHotelStore((s) => s.cancelReservation);
  // ── CHECK-IN ───────────────────────────────────────────────────────────────
  /**
   * Check in a guest.
   * Writes status: checked_in + rooms_assigned to Supabase first,
   * then updates the local Zustand store so Room Status board reacts instantly.
   */
  const checkInGuest = useCallback(async (reservationNo, roomNo) => {
    setLoading(true);
    setError(null);

    const { data, error: svcErr } = await svc.checkInReservation(reservationNo, roomNo, userId);

    if (svcErr) {
      setLoading(false);
      setError(svcErr.message);
      throw new Error(svcErr.message);
    }

    // Sync reservation status in local store
    storeUpdateRes(reservationNo, data);

    // Flip the room to occupied in local store
    useHotelStore.getState().checkInGuest(reservationNo, roomNo);

    setLoading(false);
    return data;
  }, [userId, storeUpdateRes]);

  // ── CHECK-OUT ──────────────────────────────────────────────────────────────
  /**
   * Check out a guest.
   * Writes status: checked_out to Supabase first,
   * then updates the local Zustand store so Room Status board reacts instantly.
   */
  const checkOutGuest = useCallback(async (reservationNo) => {
    setLoading(true);
    setError(null);

    const { data, error: svcErr } = await svc.checkOutReservation(reservationNo, userId);

    if (svcErr) {
      setLoading(false);
      setError(svcErr.message);
      throw new Error(svcErr.message);
    }

    // Sync reservation status in local store
    storeUpdateRes(reservationNo, data);

    // Flip the room to dirty in local store
    useHotelStore.getState().checkOutGuest(reservationNo);

    setLoading(false);
    return data;
  }, [userId, storeUpdateRes]);
  const assignRoom          = useHotelStore((s) => s.assignRoom);
  const postPayment         = useHotelStore((s) => s.postPayment);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── CREATE ─────────────────────────────────────────────────────────────────
  /**
   * Create a reservation.
   * Saves to Supabase, then pushes the returned row into the Zustand store.
   * Returns the reservation_no on success, or throws so the caller can toast.
   */
  const createReservation = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    const { data, reservationNo, error: svcErr } = await svc.createReservation(payload, userId);

    if (svcErr) {
      setLoading(false);
      setError(svcErr.message);
      throw new Error(svcErr.message);
    }

    // Sync to local store so room-status board and other panels update immediately
    useHotelStore.setState((state) => ({
      reservations: [data, ...state.reservations],
    }));

    setLoading(false);
    return reservationNo;
  }, [userId]);

  // ── UPDATE (Amend) ─────────────────────────────────────────────────────────
  /**
   * Amend an existing reservation.
   * Saves to Supabase, then updates the local Zustand entry.
   */
  const updateReservation = useCallback(async (reservationNo, updates) => {
    setLoading(true);
    setError(null);

    const { data, error: svcErr } = await svc.updateReservation(reservationNo, updates, userId);

    if (svcErr) {
      setLoading(false);
      setError(svcErr.message);
      throw new Error(svcErr.message);
    }

    // Sync to local store
    storeUpdateRes(reservationNo, data);

    setLoading(false);
    return data;
  }, [userId, storeUpdateRes]);

  // ── CANCEL ─────────────────────────────────────────────────────────────────
  /**
   * Cancel a reservation with a reason.
   * Saves to Supabase, then updates the local Zustand entry.
   */
  const cancelReservation = useCallback(async (reservationNo, reason) => {
    setLoading(true);
    setError(null);

    const { data, error: svcErr } = await svc.cancelReservation(reservationNo, reason, userId);

    if (svcErr) {
      setLoading(false);
      setError(svcErr.message);
      throw new Error(svcErr.message);
    }

    // Sync to local store (also releases assigned rooms)
    storeCancelRes(reservationNo, reason);

    setLoading(false);
    return data;
  }, [userId, storeCancelRes]);

  // ── FETCH (load real data into store) ─────────────────────────────────────
  /**
   * Load all reservations from Supabase and replace the local store list.
   * Call this on mount in the Reservations list page.
   */
  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: svcErr } = await svc.fetchAllReservations();

    if (svcErr) {
      // Supabase unreachable or table missing — keep whatever is in the store
      // (demo seed data stays usable offline / before migration is run)
      setLoading(false);
      setError(svcErr.message);
      return;
    }

    // Always replace the store with real DB data, even when the table is empty.
    // Previously the `data.length > 0` guard meant an empty Supabase table
    // left stale demo seed data in place, making the search appear to work but
    // return wrong results.
    useHotelStore.setState({ reservations: data });

    setLoading(false);
  }, []);

  // ── HELPERS ────────────────────────────────────────────────────────────────
  const getReservationByNo = useCallback((resNo) => {
    return reservations.find((r) => r.reservation_no === resNo);
  }, [reservations]);

  const getTodayArrivals = useCallback(() => {
    const today = useHotelStore.getState().selectedDate;
    return reservations.filter((r) => r.arrival === today && r.status === 'confirmed');
  }, [reservations]);

  const getTodayDepartures = useCallback(() => {
    const today = useHotelStore.getState().selectedDate;
    return reservations.filter((r) => r.departure === today && r.status === 'checked_in');
  }, [reservations]);

  return {
    // State
    reservations,
    loading,
    error,
    // Operations
    createReservation,
    updateReservation,
    cancelReservation,
    loadReservations,
    // Pass-through store operations (room/payment — still local only)
    checkInGuest,
    checkOutGuest,
    assignRoom,
    postPayment,
    // Helpers
    getReservationByNo,
    getTodayArrivals,
    getTodayDepartures,
  };
};

export default useReservations;
