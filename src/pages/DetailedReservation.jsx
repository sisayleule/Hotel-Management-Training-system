import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHotelStore } from "../store/useHotelStore.js";
import { useReservations } from "../hooks/useReservations.js";
import { fetchReservationByNo } from "../services/reservationService.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { ReservationStatusBadge } from "../components/reservations/ReservationStatusBadge.jsx";
import { RateGrid } from "../components/reservations/RateGrid.jsx";
import { GuestTable } from "../components/reservations/GuestTable.jsx";
import { CompanyLookup } from "../components/reservations/CompanyLookup.jsx";
import { GuestLookup } from "../components/reservations/GuestLookup.jsx";
import { format, parseISO, isValid } from "date-fns";
import {
  ArrowLeft,
  CreditCard,
  Printer,
  UserCheck,
  LogOut,
  Home,
  FileText,
  User,
  Users,
  Moon,
  Ban,
  Eye,
  FileEdit,
  Loader2,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

// ─── small helper ───────────────────────────────────────────────────────────
const fmt = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, "dd-MMM-yyyy") : dateStr;
  } catch {
    return dateStr;
  }
};

const Field = ({ label, value, mono = false, className = "" }) => (
  <div>
    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
      {label}
    </label>
    <div
      className={`w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 text-[11px] font-bold text-ids-sidebar truncate ${
        mono ? "font-mono" : ""
      } ${className}`}
    >
      {value || "—"}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

export const DetailedReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Supabase-backed operations
  const { checkInGuest, checkOutGuest } = useReservations();

  // Zustand store (rooms for room-number look-up, reservations for local cache)
  const reservations = useHotelStore((s) => s.reservations);
  const rooms        = useHotelStore((s) => s.rooms);

  // ── local state ────────────────────────────────────────────────────────────
  const [reservation, setReservation] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(null);

  // Popup states
  const [companyOpen,      setCompanyOpen]      = useState(false);
  const [guestLookupOpen,  setGuestLookupOpen]  = useState(false);
  const [activeGuestIdx,   setActiveGuestIdx]   = useState(0);
  const [activeTab,        setActiveTab]        = useState("stay");

  // Editable guests rows (populated from reservation once loaded)
  const [guestsTable, setGuestsTable] = useState([]);

  // ── load from Supabase first, fall back to Zustand cache ──────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError(null);

      // 1. Try Supabase
      const { data, error } = await fetchReservationByNo(id);

      if (cancelled) return;

      if (data) {
        setReservation(data);
        // Seed the guests table from the reservation's guest_name
        const name = data.guest_name || "";
        const parts = name.trim().split(/\s+/);
        setGuestsTable([{
          title:       "Mr",
          first_name:  parts[0] || "",
          middle_name: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
          last_name:   parts.length > 1 ? parts[parts.length - 1] : "",
        }]);
        setLoading(false);
        return;
      }

      // 2. Fall back to Zustand store (demo / offline data)
      const cached = reservations.find((r) => r.reservation_no === id);
      if (cached) {
        setReservation(cached);
        const parts = (cached.guest_name || "").trim().split(/\s+/);
        setGuestsTable([{
          title:       "Mr",
          first_name:  parts[0] || "",
          middle_name: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
          last_name:   parts.length > 1 ? parts[parts.length - 1] : "",
        }]);
        setLoading(false);
        return;
      }

      // 3. Nothing found
      setFetchError(`Reservation ${id} not found.`);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [id, reservations]);

  // ── derived values (always from real reservation object) ──────────────────
  const r = reservation; // shorthand

  const assignedRoom = r?.rooms_assigned?.[0] || null;
  const assignedRoomLabel = r?.rooms_assigned?.length
    ? r.rooms_assigned.join(", ")
    : "Not Assigned";

  const totalAmount = r
    ? (Number(r.rate || 0) * Number(r.nights || 1)).toFixed(2)
    : "0.00";

  // ── action handlers ───────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!assignedRoom) {
      toast.error("Please assign a room before checking in.");
      navigate(`/app/reservations/assign?id=${id}`);
      return;
    }
    try {
      await checkInGuest(id, assignedRoom);
      toast.success(`Checked in to Room ${assignedRoom} ✓`);
      navigate("/app/reservations");
    } catch (err) {
      toast.error(`Check-in failed: ${err.message}`);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOutGuest(id);
      toast.success("Guest checked out. Room set to DIRTY.");
      navigate("/app/reservations");
    } catch (err) {
      toast.error(`Check-out failed: ${err.message}`);
    }
  };

  // ── loading / error screens ───────────────────────────────────────────────
  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin text-ids-header" />
          <span className="ml-3 font-bold text-gray-500">Loading reservation…</span>
        </div>
      </PageWrapper>
    );
  }

  if (fetchError || !r) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="font-bold text-red-600">{fetchError || "Reservation not found."}</p>
          <button
            onClick={() => navigate("/app/reservations")}
            className="px-4 py-2 bg-ids-sidebar text-white rounded font-bold text-xs"
          >
            ← Back to Reservations
          </button>
        </div>
      </PageWrapper>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <div className="text-xs font-sans text-gray-800 space-y-4" id="detailed-reservation-pms-page">

        {/* ── Breadcrumb & toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ids-border pb-3 gap-3 select-none">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/app/reservations")}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-gray-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                <span>Reservations</span>
                <span>&gt;</span>
                <span className="text-ids-header font-black">
                  #{r.reservation_no} — {r.guest_name}
                </span>
              </div>
              <h1 className="text-base font-black text-ids-sidebar tracking-tight mt-0.5 flex items-center gap-2">
                Reservation Detail
                <ReservationStatusBadge status={r.status} />
              </h1>
            </div>
          </div>

          {/* Icon toolbar */}
          <div className="flex items-center space-x-2 bg-gray-50 p-2 border border-ids-border/60 rounded">
            <User   className="w-4 h-4 text-gray-400 hover:text-ids-sidebar cursor-pointer" title="Individual" />
            <Users  className="w-4 h-4 text-gray-400 hover:text-ids-sidebar cursor-pointer" title="Group" />
            <Ban
              onClick={() => navigate(`/app/reservations/cancel?id=${r.reservation_no}`)}
              className="w-4 h-4 text-red-400 hover:text-red-600 cursor-pointer"
              title="Cancel Reservation"
            />
            <Eye    className="w-4 h-4 text-gray-400 hover:text-ids-sidebar cursor-pointer" title="View Logs" />
            <Home
              onClick={() => navigate(`/app/reservations/assign?id=${r.reservation_no}`)}
              className="w-4 h-4 text-green-500 hover:text-green-600 cursor-pointer"
              title="Assign Room"
            />
            <Moon   className="w-4 h-4 text-indigo-400 hover:text-indigo-600 cursor-pointer" title="Nights" />
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

          {/* LEFT COL — Booking details */}
          <div className="xl:col-span-6 space-y-4">
            <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-4">

              {/* Header row */}
              <div className="border-b border-ids-border pb-1.5 flex justify-between items-center">
                <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider">
                  Booking Information
                </h3>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-mono font-black">
                  RESV #{r.reservation_no}
                </span>
              </div>

              {/* Dates row */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded border border-ids-border/50">
                <Field label="Arrival"   value={fmt(r.arrival)}   mono />
                <Field label="Nights"    value={String(r.nights || 1)} mono className="text-center" />
                <Field label="Departure" value={fmt(r.departure)} mono />
              </div>

              {/* Room & occupancy */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="col-span-2">
                  <Field label="Room Category" value={r.room_type} />
                </div>
                <Field label="Adults"   value={String(r.adults   || 1)} mono className="text-center" />
                <Field label="Children" value={String(r.children || 0)} mono className="text-center" />
              </div>

              {/* Assigned room highlight */}
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2">
                <div>
                  <span className="text-[9px] text-blue-700 font-bold uppercase tracking-wider block">
                    Assigned Room
                  </span>
                  <span className="font-mono font-black text-blue-900 text-sm">
                    {assignedRoomLabel}
                  </span>
                </div>
                {assignedRoom && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase">
                    {rooms.find((rm) => rm.room_no === assignedRoom)?.status?.replace("_", " ") || "assigned"}
                  </span>
                )}
              </div>

              {/* Payment & rate */}
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Payment Mode"  value={r.pay_mode} />
                <Field label="Rate / Night"  value={`ETB ${Number(r.rate || 0).toLocaleString()}`} mono />
                <Field label="Rate Code"     value={r.rate_code  || "BAR"} />
                <Field label="Meal Plan"     value={r.meal_plan  || "RO"} />
              </div>

              {/* Charges summary */}
              <div className="grid grid-cols-3 gap-2.5 bg-amber-50 border border-amber-200 rounded p-2.5">
                <div>
                  <span className="text-[9px] text-amber-800 font-bold uppercase block">Discount</span>
                  <span className="font-mono font-black text-amber-900">
                    {r.discount_percent || 0}%
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-800 font-bold uppercase block">Tax</span>
                  <span className="font-mono font-black text-amber-900">
                    {r.tax_percent || 0}%
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-800 font-bold uppercase block">Total (pre-tax)</span>
                  <span className="font-mono font-black text-amber-900">
                    ETB {Number(totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Company */}
              {r.company_code && (
                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Company Code"  value={r.company_code} mono />
                  <Field label="Billing Mode"  value="Direct Bill" />
                </div>
              )}

              {/* Special notes */}
              {(r.special_notes || r.special_requests) && (
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Special Requests / Notes
                  </label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-[11px] font-medium text-yellow-900 whitespace-pre-wrap">
                    {r.special_notes || r.special_requests}
                  </div>
                </div>
              )}

              {/* Internal notes */}
              {r.internal_notes && (
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Internal Notes (Staff Only)
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-[11px] font-medium text-gray-700 whitespace-pre-wrap">
                    {r.internal_notes}
                  </div>
                </div>
              )}

              {/* Cancellation reason (if cancelled) */}
              {r.status === "cancelled" && r.cancellation_reason && (
                <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                  <span className="text-[9px] text-red-700 font-bold uppercase block mb-1">
                    Cancellation Reason
                  </span>
                  <span className="text-[11px] font-medium text-red-800">
                    {r.cancellation_reason}
                  </span>
                </div>
              )}

              {/* Guest table */}
              <div className="border-t border-ids-border/40 pt-4">
                <GuestTable
                  guests={guestsTable}
                  setGuests={setGuestsTable}
                  onTriggerLookup={(idx) => {
                    setActiveGuestIdx(idx);
                    setGuestLookupOpen(true);
                  }}
                />
              </div>

            </div>
          </div>

          {/* RIGHT COL — Contact & tabs */}
          <div className="xl:col-span-6 space-y-4">

            {/* Guest / Contact info card */}
            <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-3.5 select-none">
              <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider border-b border-ids-border pb-1.5">
                Guest & Contact Details
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Guest Name"  value={r.guest_name} />
                <Field label="Identity No" value={r.identity_no}  mono />
                <Field label="ID Type"     value={r.identity_type || "National ID"} />
                <Field label="Phone"       value={r.phone} mono />
                <div className="col-span-2">
                  <Field label="Email" value={r.email} />
                </div>
              </div>
            </div>

            {/* Audit info card */}
            <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-3.5 select-none">
              <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider border-b border-ids-border pb-1.5">
                Record Audit
              </h3>
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Reservation No" value={r.reservation_no} mono />
                <Field label="Status"         value={r.status?.replace("_", " ").toUpperCase()} />
                <Field label="Created At"     value={r.created_at ? fmt(r.created_at.slice(0, 10)) : "—"} mono />
                <Field label="Last Updated"   value={r.updated_at ? fmt(r.updated_at.slice(0, 10)) : "—"} mono />
                <Field label="Currency"       value={r.currency || "ETB"} />
                <Field label="Svc Charge"     value={`${r.service_charge_percent || 0}%`} mono />
              </div>
            </div>

            {/* Detail tabs */}
            <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden flex flex-col md:flex-row md:min-h-[200px] select-none">
              {/* Tab list */}
              <div className="bg-gray-50 border-r border-ids-border/60 flex flex-row md:flex-col shrink-0 overflow-x-auto md:overflow-y-auto divide-x md:divide-x-0 md:divide-y divide-ids-border/30 w-full md:w-36">
                {[
                  { id: "stay",    label: "📋 Stay Info" },
                  { id: "rate",    label: "💰 Rate Grid" },
                  { id: "notes",   label: "📝 Notes" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide cursor-pointer shrink-0 ${
                      activeTab === tab.id
                        ? "bg-white text-ids-header border-l-2 border-ids-header font-black"
                        : "text-gray-500 hover:bg-gray-100/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab pane */}
              <div className="p-4 flex-1 overflow-y-auto text-[11px]">

                {activeTab === "stay" && (
                  <div className="space-y-2.5">
                    <p className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider mb-2 border-b border-ids-border/30 pb-1">
                      Stay Summary
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Reservation No.</span>
                        <span className="font-mono font-black text-ids-sidebar">{r.reservation_no}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Room Type</span>
                        <span className="font-bold text-ids-sidebar">{r.room_type}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Check-in</span>
                        <span className="font-mono font-bold">{fmt(r.arrival)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Check-out</span>
                        <span className="font-mono font-bold">{fmt(r.departure)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Nights</span>
                        <span className="font-mono font-black text-indigo-700">{r.nights}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Rooms Assigned</span>
                        <span className="font-mono font-bold text-blue-700">{assignedRoomLabel}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Adults</span>
                        <span className="font-bold">{r.adults}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Children</span>
                        <span className="font-bold">{r.children}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "rate" && (
                  <RateGrid
                    selectedRoomType={r.room_type}
                    onSelectRatePlan={(type, activeRate) => {
                      toast.success(`Rate info: ${type} @ ETB ${activeRate}/night`);
                    }}
                  />
                )}

                {activeTab === "notes" && (
                  <div className="space-y-3">
                    <p className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider mb-2 border-b border-ids-border/30 pb-1">
                      Notes & Instructions
                    </p>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Special Requests</span>
                      <p className="text-gray-700 font-medium whitespace-pre-wrap">
                        {r.special_requests || r.special_notes || "None recorded"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Internal Notes</span>
                      <p className="text-gray-700 font-medium whitespace-pre-wrap">
                        {r.internal_notes || "None"}
                      </p>
                    </div>
                    {r.status === "cancelled" && (
                      <div>
                        <span className="text-[9px] text-red-600 font-bold uppercase block mb-1">Cancellation Reason</span>
                        <p className="text-red-700 font-medium">{r.cancellation_reason || "—"}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* ── Action buttons (no status flow box — just clean buttons) ── */}
        <div className="bg-white border border-ids-border rounded-lg p-3.5 flex flex-wrap items-center justify-end gap-2 select-none shadow-2xs">

          {/* CONFIRMED */}
          {r.status === "confirmed" && (
            <>
              <button
                onClick={() => navigate(`/app/reservations/amend?id=${r.reservation_no}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <FileEdit className="w-4 h-4" />
                Amend Booking
              </button>
              <button
                onClick={() => navigate(`/app/reservations/assign?id=${r.reservation_no}`)}
                className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4 text-yellow-400" />
                Assign Room
              </button>
              <button
                onClick={handleCheckIn}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Check-In Guest
              </button>
              <button
                onClick={() => navigate(`/app/reservations/cancel?id=${r.reservation_no}`)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Ban className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}

          {/* CHECKED IN */}
          {r.status === "checked_in" && (
            <>
              <button
                onClick={() => navigate(`/app/reservations/amend?id=${r.reservation_no}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <FileEdit className="w-4 h-4" />
                Amend Booking
              </button>
              <button
                onClick={handleCheckOut}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Check-Out Guest
              </button>
              <button
                onClick={() => toast.success("Room charge posted to folio")}
                className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Post Charge
              </button>
              <button
                onClick={() => toast.success("Folio sent to printer")}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Folio
              </button>
            </>
          )}

          {/* CHECKED OUT */}
          {r.status === "checked_out" && (
            <>
              <button
                onClick={() => toast.success("Invoice sent to printer")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
              <button
                onClick={() => toast("Displaying read-only folio…")}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Folio
              </button>
            </>
          )}

          {/* CANCELLED */}
          {r.status === "cancelled" && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 font-black uppercase text-[11px] rounded tracking-wider">
              This reservation has been cancelled
            </div>
          )}

        </div>

        {/* Popups */}
        <CompanyLookup
          isOpen={companyOpen}
          onClose={() => setCompanyOpen(false)}
          onSelect={(comp) => {
            toast.success(`Company: ${comp.name}`);
            setCompanyOpen(false);
          }}
        />
        <GuestLookup
          isOpen={guestLookupOpen}
          onClose={() => setGuestLookupOpen(false)}
          onSelect={(profile) => {
            const updated = [...guestsTable];
            updated[activeGuestIdx] = {
              title:       profile.title || "Mr",
              last_name:   profile.last_name || "",
              middle_name: profile.middle_name || "",
              first_name:  profile.first_name || "",
            };
            setGuestsTable(updated);
            setGuestLookupOpen(false);
            toast.success("Guest profile loaded");
          }}
        />

      </div>
    </PageWrapper>
  );
};

export default DetailedReservation;
