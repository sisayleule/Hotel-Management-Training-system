import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHotelStore } from "../store/useHotelStore.js";
import { useReservations } from "../hooks/useReservations.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { ReservationStatusBadge } from "../components/reservations/ReservationStatusBadge.jsx";
import { GuestTable } from "../components/reservations/GuestTable.jsx";
import { GuestLookup } from "../components/reservations/GuestLookup.jsx";
import { format, parseISO, addDays, differenceInDays, isValid } from "date-fns";
import { ArrowLeft, Search, X, FileEdit, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";

export const AmendBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Store (read-only)
  const reservations = useHotelStore((state) => state.reservations);
  const guests       = useHotelStore((state) => state.guests);

  // Supabase-backed hook
  const { updateReservation, loadReservations } = useReservations();

  // Load real data from Supabase on mount
  useEffect(() => { loadReservations(); }, []);

  const [submitting, setSubmitting] = useState(false);

  // Search State
  const [searchMode, setSearchMode] = useState(true);
  const [reservationNumber, setReservationNumber] = useState("");
  const [guestNameSearch, setGuestNameSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [arrivalSearch, setArrivalSearch] = useState("");
  const [departureSearch, setDepartureSearch] = useState("");
  const [roomNumberSearch, setRoomNumberSearch] = useState("");

  // Search Results
  const [searchResults, setSearchResults] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Amendment Form State
  const [guestName, setGuestName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [nights, setNights] = useState(1);
  const [roomType, setRoomType] = useState("DLX");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [payMode, setPayMode] = useState("Cash");
  const [rate, setRate] = useState(3500);
  const [specialRequests, setSpecialRequests] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Guest Table State
  const [guestsTable, setGuestsTable] = useState([{ title: "Mr", last_name: "", middle_name: "", first_name: "" }]);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupTargetIndex, setLookupTargetIndex] = useState(null);

  // Enter-as-Tab for search form and amendment form (must be before useEffect)
  const searchFormRef = useEnterAsTab({ onSubmit: (e) => {
    e.preventDefault();
    handleSearch();
  }});
  const amendmentFormRef = useEnterAsTab({ onSubmit: (e) => {
    e.preventDefault();
    handleSave();
  }});

  // Helper: Parse guest name string into structured guest table row
  const parseGuestName = (fullName) => {
    if (!fullName || typeof fullName !== "string") {
      return { title: "Mr", last_name: "", middle_name: "", first_name: "" };
    }

    const trimmed = fullName.trim();
    const parts = trimmed.split(/\s+/); // Split on whitespace

    if (parts.length === 0) {
      return { title: "Mr", last_name: "", middle_name: "", first_name: "" };
    } else if (parts.length === 1) {
      // Single name -> treat as first name
      return { title: "Mr", last_name: "", middle_name: "", first_name: parts[0] };
    } else if (parts.length === 2) {
      // Two names -> first is first_name, second is last_name
      return { title: "Mr", last_name: parts[1], middle_name: "", first_name: parts[0] };
    } else {
      // Three or more -> first is first_name, last is last_name, middle are middle_name
      const first = parts[0];
      const last = parts[parts.length - 1];
      const middle = parts.slice(1, -1).join(" ");
      return { title: "Mr", last_name: last, middle_name: middle, first_name: first };
    }
  };


  // Auto-load reservation if ?id= parameter present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const autoLoadId = searchParams.get("id");
    if (autoLoadId) {
      const found = reservations.find((r) => r.reservation_no === autoLoadId);
      if (found) {
        loadReservationIntoForm(found);
        setSearchMode(false);
      } else {
        toast.error(`Reservation ${autoLoadId} not found`);
      }
    }
  }, [location.search, reservations]);

  // Search Handler
  const handleSearch = () => {
    let results = [...reservations];

    // AND logic: all filled fields must match
    if (reservationNumber.trim()) {
      results = results.filter((r) => r.reservation_no === reservationNumber.trim());
    }

    if (guestNameSearch.trim()) {
      const q = guestNameSearch.toLowerCase().trim();
      results = results.filter((r) => r.guest_name.toLowerCase().includes(q));
    }

    if (phoneSearch.trim()) {
      const q = phoneSearch.trim();
      results = results.filter((r) => {
        // Real Supabase reservations store phone directly on the row
        if (r.phone && r.phone.includes(q)) return true;
        // Legacy: also check the separate guests store
        const guest = guests.find((g) => g.guest_name === r.guest_name);
        return guest && guest.phone && guest.phone.includes(q);
      });
    }

    if (emailSearch.trim()) {
      const q = emailSearch.toLowerCase().trim();
      results = results.filter((r) => {
        // Real Supabase reservations store email directly on the row
        if (r.email && r.email.toLowerCase().includes(q)) return true;
        // Legacy: also check the separate guests store
        const guest = guests.find((g) => g.guest_name === r.guest_name);
        return guest && guest.email && guest.email.toLowerCase().includes(q);
      });
    }

    if (arrivalSearch) {
      results = results.filter((r) => r.arrival === arrivalSearch);
    }

    if (departureSearch) {
      results = results.filter((r) => r.departure === departureSearch);
    }

    if (roomNumberSearch.trim()) {
      const q = roomNumberSearch.trim();
      results = results.filter((r) => r.rooms_assigned && r.rooms_assigned.includes(q));
    }

    setSearchResults(results);

    // Auto-load if exactly 1 result
    if (results.length === 1) {
      loadReservationIntoForm(results[0]);
      setSearchMode(false);
    } else if (results.length === 0) {
      toast.error("No reservations found matching your search criteria");
    }
  };

  // Clear Search
  const handleClearSearch = () => {
    setReservationNumber("");
    setGuestNameSearch("");
    setPhoneSearch("");
    setEmailSearch("");
    setArrivalSearch("");
    setDepartureSearch("");
    setRoomNumberSearch("");
    setSearchResults([]);
  };

  // Load reservation into amendment form
  const loadReservationIntoForm = (reservation) => {
    setSelectedReservation(reservation);
    setGuestName(reservation.guest_name || "");
    setArrival(reservation.arrival || "");
    setDeparture(reservation.departure || "");
    setNights(reservation.nights || 1);
    setRoomType(reservation.room_type || "DLX");
    setAdults(reservation.adults || 1);
    setChildren(reservation.children || 0);
    setPayMode(reservation.pay_mode || "Cash");
    setRate(reservation.rate || 3500);
    setSpecialRequests(reservation.special_requests || reservation.special_notes || "");
    setInternalNotes(reservation.internal_notes || "");

    // Phone/email: real Supabase rows store these on the reservation itself.
    // Fall back to the legacy guests store for old demo seed data.
    const guestData = guests.find((g) => g.guest_name === reservation.guest_name);
    setPhoneNumber(reservation.phone || guestData?.phone || "");
    setEmailAddress(reservation.email || guestData?.email || "");

    // Parse primary guest name into guest table row
    const primaryGuest = parseGuestName(reservation.guest_name);
    setGuestsTable([primaryGuest]);
  };

  // Date Auto-Calculation (matching DetailedReservation logic)
  const handleArrivalChange = (val) => {
    setArrival(val);
    try {
      const arr = parseISO(val);
      if (isValid(arr)) {
        const dep = addDays(arr, nights);
        setDeparture(format(dep, "yyyy-MM-dd"));
      }
    } catch {}
  };

  const handleDepartureChange = (val) => {
    setDeparture(val);
    try {
      const arr = parseISO(arrival);
      const dep = parseISO(val);
      if (isValid(arr) && isValid(dep)) {
        const diff = differenceInDays(dep, arr);
        if (diff >= 1) {
          setNights(diff);
        } else {
          setNights(1);
          setDeparture(format(addDays(arr, 1), "yyyy-MM-dd"));
        }
      }
    } catch {}
  };

  const handleNightsChange = (val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setNights(num);
    try {
      const arr = parseISO(arrival);
      if (isValid(arr)) {
        const dep = addDays(arr, num);
        setDeparture(format(dep, "yyyy-MM-dd"));
      }
    } catch {}
  };

  // Guest Lookup Handlers
  const handleTriggerLookup = (index) => {
    setLookupTargetIndex(index);
    setLookupOpen(true);
  };

  const handleGuestSelect = (guestData) => {
    if (lookupTargetIndex !== null) {
      const updated = [...guestsTable];
      updated[lookupTargetIndex] = { ...updated[lookupTargetIndex], ...guestData };
      setGuestsTable(updated);
    }
  };

  // Save Changes — writes to Supabase then syncs local store
  const handleSave = async () => {
    if (!selectedReservation) {
      toast.error("No reservation selected");
      return;
    }

    // Status validation
    const status = selectedReservation.status;
    if (status === "checked_out" || status === "cancelled") {
      toast.error(`Cannot amend ${status} reservations`);
      return;
    }

    setSubmitting(true);
    try {
      await updateReservation(selectedReservation.reservation_no, {
        guest_name:      guestName,
        phone:           phoneNumber,
        email:           emailAddress,
        arrival,
        departure,
        nights,
        room_type:       roomType,
        adults:          Number(adults),
        children:        Number(children),
        pay_mode:        payMode,
        rate:            Number(rate),
        total_amount:    Number(rate) * nights,
        special_requests: specialRequests,
        internal_notes:  internalNotes,
      });

      toast.success(`Reservation ${selectedReservation.reservation_no} amended successfully ✓`);

      // Reset and return to search
      setSearchMode(true);
      setSelectedReservation(null);
      handleClearSearch();
    } catch (err) {
      toast.error(`Amendment failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Return to search mode
  const handleBackToSearch = () => {
    setSearchMode(true);
    setSelectedReservation(null);
    setSearchResults([]);
  };

  return (
    <PageWrapper>
      <div className="text-xs font-sans text-gray-800 space-y-4" id="amend-booking-page">
        
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
                <span className="text-ids-header font-black">Amend Booking</span>
              </div>
              <h1 className="text-base font-black text-ids-sidebar tracking-tight mt-0.5">
                Amendment Module / Booking Modification
              </h1>
            </div>
          </div>
        </div>

        {/* SEARCH MODE */}
        {searchMode && (
          <>
            {/* Multi-Field Search Form */}
            <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-4">
              <div className="border-b border-ids-border pb-2">
                <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider">
                  🔍 Search Reservations (All fields optional, AND logic)
                </h3>
              </div>

              <form ref={searchFormRef} onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Reservation Number
                  </label>
                  <input
                    type="text"
                    value={reservationNumber}
                    onChange={(e) => setReservationNumber(e.target.value)}
                    placeholder="e.g. RES001"
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    value={guestNameSearch}
                    onChange={(e) => setGuestNameSearch(e.target.value)}
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
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    placeholder="Partial match"
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="text"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
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
                    value={arrivalSearch}
                    onChange={(e) => setArrivalSearch(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={departureSearch}
                    onChange={(e) => setDepartureSearch(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={roomNumberSearch}
                    onChange={(e) => setRoomNumberSearch(e.target.value)}
                    placeholder="e.g. 301"
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>
              </div>
              </form>

              <div className="flex items-center space-x-2 pt-2 border-t border-ids-border/50">
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>🔍 Search Reservations</span>
                </button>
              </div>
            </div>

            {/* Search Results List */}
            {searchResults.length >= 2 && (
              <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-3">
                <div className="border-b border-ids-border pb-2">
                  <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider">
                    Search Results ({searchResults.length} found)
                  </h3>
                </div>

                <div className="space-y-2">
                  {searchResults.map((res) => (
                    <div
                      key={res.reservation_no}
                      className="bg-gray-50 border border-ids-border rounded-lg p-3 flex items-center justify-between hover:bg-blue-50/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-ids-header text-xs">
                            {res.reservation_no}
                          </span>
                          <ReservationStatusBadge status={res.status} />
                        </div>
                        <div className="font-bold text-ids-sidebar text-sm">{res.guest_name}</div>
                        <div className="text-[10px] text-gray-500 font-mono font-bold">
                          Arrival: {res.arrival} • Room: {res.rooms_assigned?.join(", ") || "Not assigned"}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          loadReservationIntoForm(res);
                          setSearchMode(false);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] rounded tracking-wide cursor-pointer flex items-center space-x-1"
                      >
                        <span>Select to Amend →</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.length === 0 && reservationNumber && (
              <div className="bg-white border border-ids-border rounded-lg p-8 text-center shadow-3xs">
                <p className="text-gray-400 font-bold uppercase text-[11px]">No reservations found</p>
              </div>
            )}
          </>
        )}

        {/* AMENDMENT FORM MODE */}
        {!searchMode && selectedReservation && (
          <>
            <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-4">
              {/* Header */}
              <div className="border-b border-ids-border pb-2 flex justify-between items-center">
                <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider">
                  ✏️ Amendment Form
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Reservation:</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded font-mono font-black">
                    {selectedReservation.reservation_no}
                  </span>
                  <ReservationStatusBadge status={selectedReservation.status} />
                </div>
              </div>

              {/* Read-only: Rooms Assigned */}
              {selectedReservation.rooms_assigned && selectedReservation.rooms_assigned.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2.5">
                  <span className="text-[9px] text-blue-900 font-bold uppercase tracking-wide block mb-1">
                    Rooms Assigned
                  </span>
                  <span className="font-mono font-black text-blue-900">
                    {selectedReservation.rooms_assigned.join(", ")}
                  </span>
                </div>
              )}

              {/* Status Block Warning */}
              {(selectedReservation.status === "checked_out" || selectedReservation.status === "cancelled") && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
                  <p className="font-bold text-red-700 uppercase text-[11px]">
                    ⚠️ Cannot amend {selectedReservation.status} reservations
                  </p>
                </div>
              )}

              {/* Editable Fields Grid */}
              <form ref={amendmentFormRef} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="text"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Arrival Date *
                  </label>
                  <input
                    type="date"
                    value={arrival}
                    onChange={(e) => handleArrivalChange(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    value={departure}
                    onChange={(e) => handleDepartureChange(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Nights (Auto-calculated)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nights}
                    readOnly
                    className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-mono font-black text-center text-ids-header"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Room Type *
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold text-ids-sidebar"
                  >
                    <option value="STD">STD (Standard)</option>
                    <option value="SGL">SGL (Single)</option>
                    <option value="DLX">DLX (Deluxe)</option>
                    <option value="EXE">EXE (Executive)</option>
                    <option value="SUI">SUI (Suite)</option>
                    <option value="FAM">FAM (Family)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Adults *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adults}
                    onChange={(e) => setAdults(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold text-ids-sidebar"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Direct Bill">Direct Bill</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Rate (per night) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Total Amount (Read-only)
                  </label>
                  <div className="w-full bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 font-mono font-black text-amber-900">
                    ₹{rate * nights}
                  </div>
                </div>
              </div>

              {/* Guest Table Section - positioned after rate/payment, before special requests */}
              <div className="border-t border-ids-border pt-3.5">
                <GuestTable
                  guests={guestsTable}
                  setGuests={setGuestsTable}
                  onTriggerLookup={handleTriggerLookup}
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Special Requests
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows="2"
                  className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-medium"
                  placeholder="Guest special requests or preferences..."
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows="2"
                  className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-medium"
                  placeholder="Internal staff notes (not visible to guest)..."
                />
              </div>
              </form>
            </div>

            {/* Action Buttons */}
            <div className="bg-white border border-ids-border rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 select-none shadow-2xs">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBackToSearch}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => navigate("/app/reservations")}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider transition-colors cursor-pointer"
                >
                  Back to Reservations
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={submitting || selectedReservation.status === "checked_out" || selectedReservation.status === "cancelled"}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[11px] rounded tracking-widest flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? "Saving…" : "💾 Save Changes"}</span>
              </button>
            </div>
          </>
        )}

      </div>
    </PageWrapper>
  );
};

export default AmendBooking;
