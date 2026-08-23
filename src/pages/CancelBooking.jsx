import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHotelStore } from "../store/useHotelStore.js";
import { useReservations } from "../hooks/useReservations.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { ReservationStatusBadge } from "../components/reservations/ReservationStatusBadge.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";
import { Ban, Search, X, Check, AlertCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export const CancelBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Store (read-only — reservations list, guests for contact lookup)
  const reservations = useHotelStore((state) => state.reservations);
  const guests       = useHotelStore((state) => state.guests);
  const currentUser  = useHotelStore((state) => state.currentUser);

  // Supabase-backed hook
  const { cancelReservation, loadReservations } = useReservations();

  // Load real data from Supabase on mount
  useEffect(() => { loadReservations(); }, []);

  // Local State
  const [mode, setMode] = useState("search"); // "search" | "cancelling"
  const [searchCriteria, setSearchCriteria] = useState({
    reservation_no: "",
    guest_name: "",
    phone: "",
    email: "",
    arrival: "",
    departure: "",
    room_no: ""
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Guest contact lookup cache
  const guestContactCache = useMemo(() => {
    const cache = new Map();
    guests.forEach(guest => {
      cache.set(guest.guest_name.toLowerCase(), {
        phone: guest.phone,
        email: guest.email
      });
    });
    return cache;
  }, [guests]);

  // Helper: Get guest contacts
  const getGuestContacts = (guestName) => {
    return guestContactCache.get(guestName.toLowerCase()) || { phone: "", email: "" };
  };

  // Auto-load reservation from URL parameter
  useEffect(() => {
    const reservationId = searchParams.get("id");
    if (reservationId) {
      loadReservation(reservationId);
    }
  }, [searchParams]);

  // Search handler with AND logic
  const handleSearch = () => {
    // Clear previous errors
    setErrors({});

    // Check if any criteria is filled
    const hasAnyCriteria = Object.values(searchCriteria).some(val => val.trim() !== "");
    if (!hasAnyCriteria) {
      setSearchResults([]);
      return;
    }

    let results = [...reservations];

    // Apply AND logic - all filled fields must match
    if (searchCriteria.reservation_no.trim()) {
      const q = searchCriteria.reservation_no.toLowerCase().trim();
      results = results.filter(r => r.reservation_no.toLowerCase().includes(q));
    }

    if (searchCriteria.guest_name.trim()) {
      const q = searchCriteria.guest_name.toLowerCase().trim();
      results = results.filter(r => r.guest_name.toLowerCase().includes(q));
    }

    if (searchCriteria.phone.trim()) {
      const q = searchCriteria.phone.trim();
      results = results.filter(r => {
        // Real Supabase rows store phone directly on the reservation
        if (r.phone && r.phone.includes(q)) return true;
        // Legacy guests store fallback
        const contacts = getGuestContacts(r.guest_name);
        return contacts.phone && contacts.phone.includes(q);
      });
    }

    if (searchCriteria.email.trim()) {
      const q = searchCriteria.email.toLowerCase().trim();
      results = results.filter(r => {
        // Real Supabase rows store email directly on the reservation
        if (r.email && r.email.toLowerCase().includes(q)) return true;
        // Legacy guests store fallback
        const contacts = getGuestContacts(r.guest_name);
        return contacts.email && contacts.email.toLowerCase().includes(q);
      });
    }

    if (searchCriteria.arrival) {
      results = results.filter(r => r.arrival === searchCriteria.arrival);
    }

    if (searchCriteria.departure) {
      results = results.filter(r => r.departure === searchCriteria.departure);
    }

    if (searchCriteria.room_no.trim()) {
      const q = searchCriteria.room_no.trim();
      results = results.filter(r => r.rooms_assigned && r.rooms_assigned.includes(q));
    }

    setSearchResults(results);

    // Auto-load if exactly one match
    if (results.length === 1) {
      loadReservation(results[0].reservation_no);
    } else if (results.length === 0) {
      toast.error("No reservations found matching your search criteria");
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchCriteria({
      reservation_no: "",
      guest_name: "",
      phone: "",
      email: "",
      arrival: "",
      departure: "",
      room_no: ""
    });
    setSearchResults([]);
    setErrors({});
  };

  // Load reservation into cancellation mode
  const loadReservation = (reservationNo) => {
    const reservation = reservations.find(r => r.reservation_no === reservationNo);
    if (!reservation) {
      toast.error("Reservation not found - it may have been deleted");
      setMode("search");
      return;
    }

    setSelectedReservation(reservation);
    setMode("cancelling");
    setCancellationReason("");
    setErrors({});

    // Validate if cancellable
    if (reservation.status === "checked_out") {
      setErrors(prev => ({ ...prev, status: "Cannot cancel checked-out reservations" }));
    } else if (reservation.status === "cancelled") {
      setErrors(prev => ({ ...prev, status: "Reservation is already cancelled" }));
    }
  };

  // Validate cancellation reason
  const validateCancellationReason = (reason) => {
    const trimmed = reason.trim();

    if (trimmed.length === 0) {
      return {
        valid: false,
        error: "Cancellation reason is required"
      };
    }

    if (trimmed.length < 10) {
      return {
        valid: false,
        error: "Please provide a detailed reason (minimum 10 characters)"
      };
    }

    return { valid: true };
  };

  // Handle cancel reservation button click
  const handleCancelReservation = () => {
    // Validate reason
    const validation = validateCancellationReason(cancellationReason);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, reason: validation.error }));
      return;
    }

    // Clear reason error
    setErrors(prev => ({ ...prev, reason: "" }));

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  // Confirm cancellation — saves to Supabase then clears local state
  const confirmCancellation = async () => {
    setSubmitting(true);
    try {
      await cancelReservation(selectedReservation.reservation_no, cancellationReason);
      toast.success(`Reservation ${selectedReservation.reservation_no} cancelled successfully ✓`, {
        duration: 3000,
        icon: "✓"
      });

      // Reset to search mode
      setMode("search");
      setSelectedReservation(null);
      setCancellationReason("");
      setSearchCriteria({
        reservation_no: "",
        guest_name: "",
        phone: "",
        email: "",
        arrival: "",
        departure: "",
        room_no: ""
      });
      setSearchResults([]);
      setShowConfirmDialog(false);
      setErrors({});
    } catch (error) {
      toast.error("Cancellation failed — please try again", {
        duration: 4000,
        icon: "⚠️"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Back to search
  const handleBackToSearch = () => {
    setMode("search");
    setSelectedReservation(null);
    setCancellationReason("");
    setErrors({});
  };

  // Suggested reasons
  const suggestedReasons = [
    "Guest requested cancellation",
    "Emergency situation",
    "Duplicate booking found",
    "Payment failure occurred",
    "Change of travel plans",
    "No-show confirmed"
  ];

  // Check if reservation is cancellable
  const isCancellable = selectedReservation && 
    (selectedReservation.status === "confirmed" || selectedReservation.status === "checked_in") &&
    cancellationReason.trim().length >= 10;

  // Keyboard navigation for search form
  const searchFormRef = useEnterAsTab({ onSubmit: handleSearch });

  return (
    <PageWrapper>
      <div className="text-xs font-sans text-gray-800 space-y-4" id="cancel-booking-page">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ids-border pb-3 gap-3 select-none">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/app/reservations")}
              className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-gray-400 font-bold uppercase text-[9px] tracking-wider flex items-center space-x-1">
                <span>Reservations</span>
                <span>&gt;</span>
                <span className="text-ids-header font-black">Cancel Booking</span>
              </div>
              <h1 className="text-base font-black text-ids-sidebar tracking-tight mt-0.5">
                Cancellation Module / Reservation Cancellation
              </h1>
            </div>
          </div>
          {currentUser?.role === "hotel_manager" && (
            <div className="px-2 py-1 bg-red-100 border border-red-300 rounded text-[9px] font-black text-red-700 uppercase tracking-wider">
              Manager Access
            </div>
          )}
        </div>

        {/* SEARCH MODE */}
        {mode === "search" && (
          <>
            {/* Multi-Field Search Form */}
            <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6">
              <div className="border-b border-ids-border pb-2 mb-4">
                <h2 className="text-sm font-black text-ids-sidebar uppercase tracking-wider">
                  Search Reservations
                </h2>
              </div>

              <form ref={searchFormRef} onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Reservation Number
                    </label>
                    <input
                      type="text"
                      value={searchCriteria.reservation_no}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, reservation_no: e.target.value }))}
                      placeholder="e.g. RES001"
                      className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      value={searchCriteria.guest_name}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, guest_name: e.target.value }))}
                      placeholder="Partial match"
                      className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={searchCriteria.phone}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Partial match"
                      className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={searchCriteria.email}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Partial match"
                      className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Arrival Date
                    </label>
                    <input
                      type="date"
                      value={searchCriteria.arrival}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, arrival: e.target.value }))}
                      className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      value={searchCriteria.departure}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, departure: e.target.value }))}
                      className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={searchCriteria.room_no}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, room_no: e.target.value }))}
                      placeholder="e.g. 201"
                      className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>
                </div>
              </form>

              <div className="flex items-center space-x-2 pt-3 mt-3 border-t border-ids-border/50">
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 1 && (
              <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6">
                <div className="border-b border-ids-border pb-2 mb-4">
                  <h2 className="text-sm font-black text-ids-sidebar uppercase tracking-wider">
                    Search Results ({searchResults.length})
                  </h2>
                </div>

                <div className="space-y-2">
                  {searchResults.map((res) => (
                    <div
                      key={res.reservation_no}
                      onClick={() => loadReservation(res.reservation_no)}
                      className="border border-ids-border bg-white p-3 rounded shadow-3xs hover:shadow-sm transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-ids-sidebar">
                              {res.reservation_no}
                            </span>
                            <ReservationStatusBadge status={res.status} />
                          </div>
                          <div className="font-bold text-ids-sidebar">{res.guest_name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            Arrival: {res.arrival} • Rooms: {res.rooms_assigned?.join(", ") || "Not assigned"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {searchResults.length === 0 && !Object.values(searchCriteria).some(val => val.trim()) && (
              <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-8 text-center">
                <p className="text-gray-400 font-bold uppercase text-[11px]">
                  Enter search criteria to find reservations
                </p>
              </div>
            )}
          </>
        )}

        {/* CANCELLATION MODE */}
        {mode === "cancelling" && selectedReservation && (
          <>
            {/* Reservation Details */}
            <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6">
              <div className="border-b border-ids-border pb-2 mb-4 flex justify-between items-center">
                <h2 className="text-sm font-black text-ids-sidebar uppercase tracking-wider">
                  Reservation Details
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-ids-sidebar">
                    {selectedReservation.reservation_no}
                  </span>
                  <ReservationStatusBadge status={selectedReservation.status} />
                </div>
              </div>

              {/* Status Warning */}
              {errors.status && (
                <div className="bg-red-50 border-l-4 border-red-600 p-3 mb-4 text-sm text-red-700 flex items-center gap-2">
                  <Ban className="w-4 h-4 flex-shrink-0" />
                  <span className="font-bold">{errors.status}</span>
                </div>
              )}

              {/* Assigned Rooms Highlight */}
              {selectedReservation.rooms_assigned && selectedReservation.rooms_assigned.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                  <span className="text-[10px] text-amber-900 font-bold uppercase tracking-wide block mb-1">
                    Assigned Rooms
                  </span>
                  <span className="font-mono font-black text-amber-900">
                    {selectedReservation.rooms_assigned.join(", ")}
                  </span>
                </div>
              )}

              {/* Reservation Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guest Information */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-1">
                    Guest Information
                  </h3>
                  {[
                    { label: "Guest Name", value: selectedReservation.guest_name },
                    { label: "Phone", value: selectedReservation.phone || getGuestContacts(selectedReservation.guest_name).phone || "—" },
                    { label: "Email", value: selectedReservation.email || getGuestContacts(selectedReservation.guest_name).email || "—" }
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                      <div className="text-ids-sidebar font-mono text-sm">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Stay Details */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-1">
                    Stay Details
                  </h3>
                  {[
                    { label: "Arrival", value: selectedReservation.arrival },
                    { label: "Departure", value: selectedReservation.departure },
                    { label: "Nights", value: selectedReservation.nights },
                    { label: "Adults", value: selectedReservation.adults },
                    { label: "Children", value: selectedReservation.children }
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                      <div className="text-ids-sidebar font-mono text-sm">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Room & Billing */}
                <div className="space-y-3 md:col-span-2">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-1">
                    Room & Billing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Room Type", value: selectedReservation.room_type },
                      { label: "Payment Mode", value: selectedReservation.pay_mode },
                      { label: "Rate/Night", value: `₹ ${selectedReservation.rate}` },
                      { label: "Total Amount", value: `₹ ${selectedReservation.total_amount}` }
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-ids-sidebar font-mono text-sm font-bold">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Reason */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-3xs p-4 md:p-6">
              <h2 className="text-sm font-black text-red-700 uppercase tracking-wider mb-4">
                Cancellation Reason *
              </h2>

              {/* Suggested Reasons */}
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-red-700 uppercase mb-2">
                  Suggested Reasons (Click to use)
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestedReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setCancellationReason(reason)}
                      className="px-3 py-1 bg-ids-background border border-ids-border rounded text-xs hover:bg-ids-sidebar hover:text-white transition-colors cursor-pointer"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => {
                    setCancellationReason(e.target.value);
                    // Clear error on change
                    if (errors.reason) {
                      setErrors(prev => ({ ...prev, reason: "" }));
                    }
                  }}
                  rows="4"
                  placeholder="Enter detailed reason for cancellation (minimum 10 characters)..."
                  className="w-full p-3 border-2 border-red-200 bg-white rounded focus:border-red-400 focus:outline-none font-mono text-sm"
                />
                {errors.reason && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    {errors.reason}
                  </p>
                )}
                <p className="text-[10px] text-red-600 mt-1 font-bold">
                  {cancellationReason.trim().length} / 10 characters minimum
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBackToSearch}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider transition-colors cursor-pointer"
              >
                Back to Search
              </button>
              <button
                onClick={handleCancelReservation}
                disabled={!isCancellable || errors.status}
                className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[11px] rounded tracking-widest flex items-center justify-center space-x-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ban className="w-4 h-4" />
                <span>Cancel Reservation</span>
              </button>
            </div>
          </>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && selectedReservation && (
          <Modal 
            isOpen={showConfirmDialog} 
            onClose={() => setShowConfirmDialog(false)}
            title="Confirm Cancellation"
            maxWidthClass="max-w-md"
          >
            <div className="space-y-2 mb-6 text-sm">
              <p>
                <span className="text-gray-400">Reservation:</span>{" "}
                <span className="font-mono font-bold">{selectedReservation.reservation_no}</span>
              </p>
              <p>
                <span className="text-gray-400">Guest:</span>{" "}
                {selectedReservation.guest_name}
              </p>
              <p>
                <span className="text-gray-400">Rooms:</span>{" "}
                <span className="font-mono">
                  {selectedReservation.rooms_assigned?.join(", ") || "Not assigned"}
                </span>
              </p>
              <p>
                <span className="text-gray-400">Reason:</span>{" "}
                {cancellationReason}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmCancellation}
                disabled={submitting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {submitting ? "Cancelling…" : "Confirm Cancel"}
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={submitting}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors font-bold disabled:opacity-60"
              >
                Go Back
              </button>
            </div>
          </Modal>
        )}
      </div>
    </PageWrapper>
  );
};

export default CancelBooking;
