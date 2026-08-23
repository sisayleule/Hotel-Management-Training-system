import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useHotelStore } from "../../store/useHotelStore.js";
import { CompanyLookup } from "./CompanyLookup.jsx";
import { GuestLookup } from "./GuestLookup.jsx";
import { GuestTable } from "./GuestTable.jsx";
import { DuplicateGuestModal } from "./DuplicateGuestModal.jsx";
import { ratePlans } from "../../data/ratePlans.js";
import {
  format,
  addDays,
  differenceInDays,
  parseISO,
  isValid
} from "date-fns";
import {
  X,
  Check,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Home,
  User,
  Users,
  Moon,
  Ban,
  Eye,
  Percent
} from "lucide-react";
import toast from "react-hot-toast";
import { useEnterAsTab } from "../../hooks/useEnterAsTab.js";

/**
 * QuickReservation form modal or full page
 * @param {Object} props
 * @param {boolean} [props.isOpen] - Used for modal mode
 * @param {function(): void} [props.onClose] - Used for modal mode
 */
export const QuickReservation = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const createReservation = useHotelStore((state) => state.createReservation);
  const allGuests = useHotelStore((state) => state.guests);
  const selectedDate = useHotelStore((state) => state.selectedDate || "2026-06-30");

  // Form states
  const [arrivalDateStr, setArrivalDateStr] = useState(selectedDate);
  const [nightsCount, setNightsCount] = useState(1);
  const [departureDateStr, setDepartureDateStr] = useState(
    format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd")
  );

  const [housePlanActive, setHousePlanActive] = useState(false);
  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLookupOpen, setCompanyLookupOpen] = useState(false);

  // Guest table data
  const [guests, setGuests] = useState([
    { title: "Mr", last_name: "", middle_name: "", first_name: "" }
  ]);
  const [activeGuestIndex, setActiveGuestIndex] = useState(0);
  const [guestLookupOpen, setGuestLookupOpen] = useState(false);

  // Duplicate guest detection
  const [duplicateGuestModalOpen, setDuplicateGuestModalOpen] = useState(false);
  const [matchedGuest, setMatchedGuest] = useState(null);
  const [pendingReservationData, setPendingReservationData] = useState(null);

  // Enter-as-Tab hook
  const formRef = useEnterAsTab({ onSubmit: handleSubmit(onFormSubmit) });

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid: isFormValid }
  } = useForm({
    mode: "onChange",
    defaultValues: {
      property: "DEMO",
      booker_type: "Direct",
      booker_code: "",
      booker_name: "",
      room_type: "DLX",
      booking_mode: "Phone",
      rooms: 1,
      adults: 1,
      children: 0,
      status: "confirmed"
    }
  });

  const selectedRoomType = watch("room_type");

  // Format Helper for screen display
  const formatDateDisplay = (dateStr) => {
    try {
      const d = parseISO(dateStr);
      if (!isValid(d)) return "—";
      return format(d, "dd-MMM-yyyy").toUpperCase();
    } catch {
      return dateStr;
    }
  };

  const formatDayName = (dateStr) => {
    try {
      const d = parseISO(dateStr);
      if (!isValid(d)) return "—";
      return format(d, "EEEE").toUpperCase();
    } catch {
      return "—";
    }
  };

  // Date Change Handlers
  const handleArrivalChange = (e) => {
    const val = e.target.value;
    setArrivalDateStr(val);
    try {
      const arrD = parseISO(val);
      if (isValid(arrD)) {
        const depD = addDays(arrD, nightsCount);
        setDepartureDateStr(format(depD, "yyyy-MM-dd"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDepartureChange = (e) => {
    const val = e.target.value;
    setDepartureDateStr(val);
    try {
      const arrD = parseISO(arrivalDateStr);
      const depD = parseISO(val);
      if (isValid(arrD) && isValid(depD)) {
        const diff = differenceInDays(depD, arrD);
        if (diff >= 1) {
          setNightsCount(diff);
        } else {
          setNightsCount(1);
          setDepartureDateStr(format(addDays(arrD, 1), "yyyy-MM-dd"));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNightsChange = (e) => {
    const val = parseInt(e.target.value, 10) || 1;
    const safeVal = Math.max(1, val);
    setNightsCount(safeVal);
    try {
      const arrD = parseISO(arrivalDateStr);
      if (isValid(arrD)) {
        const depD = addDays(arrD, safeVal);
        setDepartureDateStr(format(depD, "yyyy-MM-dd"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load Rates based on Room Type Selected
  const rateSummary = useMemo(() => {
    const matched = ratePlans.find((p) => p.room_type === selectedRoomType);
    if (matched) return matched;
    const dlxMatch = ratePlans.find((p) => p.room_type === "DLX");
    return dlxMatch || {};
  }, [selectedRoomType]);

  // Select Company Callback
  const handleCompanySelect = useCallback((comp) => {
    setCompanyCode(comp.code);
    setCompanyName(comp.name);
  }, []);

  // Guest Row Click triggers history popup
  const handleTriggerGuestLookup = useCallback((index) => {
    setActiveGuestIndex(index);
    setGuestLookupOpen(true);
  }, []);

  // Selected Guest Profile from History Callback
  const handleGuestSelect = useCallback(
    (profile) => {
      const updated = [...guests];
      updated[activeGuestIndex] = {
        title: profile.title || "Mr",
        last_name: profile.last_name || "",
        middle_name: profile.middle_name || "",
        first_name: profile.first_name || ""
      };
      setGuests(updated);

      // If first row, also set primary booker name
      if (activeGuestIndex === 0) {
        const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
        setValue("booker_name", fullName);
      }
    },
    [guests, activeGuestIndex, setValue]
  );

  const saveBooking = (formData, redirectAfterSave) => {
    // Collect full guest details
    const primaryGuest = guests[0] || {};
    const primaryGuestName = `${primaryGuest.title || "Mr"} ${primaryGuest.first_name || ""} ${primaryGuest.last_name || ""}`.trim() || "Guest";

    // Check for duplicate guest name (case-insensitive, trimmed)
    const normalizedName = primaryGuestName.toLowerCase().trim();
    const existingGuest = allGuests.find(
      (g) => g.guest_name.toLowerCase().trim() === normalizedName
    );

    const finalReservationData = {
      guest_name: primaryGuestName,
      company_code: companyCode,
      room_type: formData.room_type,
      arrival: arrivalDateStr,
      departure: departureDateStr,
      nights: nightsCount,
      adults: Number(formData.adults),
      children: Number(formData.children),
      pay_mode: companyCode ? "Direct Bill" : "Cash",
      status: formData.status,
      rate: Number(rateSummary.single || 3500),
      total_amount: Number(rateSummary.single || 3500) * nightsCount,
      rooms_assigned: [] // Not assigned initially
    };

    if (existingGuest) {
      // Duplicate found - show modal for user decision
      setMatchedGuest(existingGuest);
      setPendingReservationData(finalReservationData);
      setDuplicateGuestModalOpen(true);
    } else {
      // No duplicate - proceed with creating guest and reservation
      completeSaveBooking(finalReservationData, false, false);
    }
  };

  const completeSaveBooking = (reservationData, reuseExistingGuest, existingGuestId) => {
    // Add guest handling flags
    const dataWithGuestFlags = {
      ...reservationData,
      _reuseExistingGuest: reuseExistingGuest,
      _existingGuestId: existingGuestId,
      _forceCreateNewGuest: !reuseExistingGuest && existingGuestId !== null // True when user chose "Create New" from dialog
    };

    const reservationNo = createReservation(dataWithGuestFlags);
    toast.success(`Reservation #${reservationNo} created successfully ✓`);

    // Reset duplicate modal state
    setDuplicateGuestModalOpen(false);
    setMatchedGuest(null);
    setPendingReservationData(null);

    // Always navigate to reservations list after successful creation
    if (onClose) onClose(); // Close modal if it exists
    navigate("/app/reservations"); // Always navigate to refresh the list
  };

  const handleContinueWithExistingGuest = () => {
    // User chose to reuse the existing guest record
    if (pendingReservationData && matchedGuest) {
      completeSaveBooking(pendingReservationData, true, matchedGuest.guest_id);
    }
  };

  const handleCreateNewGuest = () => {
    // User chose to create a new guest record despite the name match
    // Pass a sentinel value to indicate this was an explicit choice from the dialog
    if (pendingReservationData) {
      completeSaveBooking(pendingReservationData, false, "force_new");
    }
  };

  const onFormSubmit = (data) => {
    saveBooking(data, false);
  };

  const handleProceed = () => {
    // Trigger direct validation and proceed
    const primaryGuest = guests[0] || {};
    const name = `${primaryGuest.first_name || ""} ${primaryGuest.last_name || ""}`.trim();
    if (!name) {
      toast.error("Please add at least one guest name in the registration grid.");
      return;
    }
    const data = {
      room_type: selectedRoomType,
      adults: watch("adults"),
      children: watch("children"),
      status: watch("status")
    };
    saveBooking(data, true);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full sm:max-w-[550px] h-full sm:h-auto sm:max-h-[95vh] bg-white sm:rounded-lg shadow-2xl flex flex-col overflow-hidden text-[11px] font-sans text-gray-800 border border-ids-border">
        
        {/* Header Bar */}
        <div className="bg-ids-sidebar text-white px-3.5 py-3 flex justify-between items-center shrink-0 border-b border-ids-header select-none">
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>Quick Reservation / Make V6.5.002.20</span>
            </h3>
            {/* 8 PMS standard icons */}
            <div className="flex space-x-2 mt-1.5 text-white/50">
              <User className="w-3.5 h-3.5 hover:text-white transition-colors" title="Single" />
              <Users className="w-3.5 h-3.5 hover:text-white transition-colors" title="Couple" />
              <Ban className="w-3.5 h-3.5 hover:text-white transition-colors" title="Cancel" />
              <Eye className="w-3.5 h-3.5 hover:text-white transition-colors" title="View" />
              <Home className="w-3.5 h-3.5 hover:text-white transition-colors" title="Room" />
              <Users className="w-3.5 h-3.5 hover:text-white transition-colors" title="Family" />
              <Moon className="w-3.5 h-3.5 hover:text-white transition-colors" title="Night" />
              <Moon className="w-3.5 h-3.5 hover:text-white transition-colors" title="Extended" />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose || (() => navigate("/app/reservations"))}
            className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          ref={formRef}
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* ARRIVAL ROW */}
          <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2 rounded border border-ids-border/50">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Arrival Date
              </label>
              <input
                id="arrival-date-input"
                type="date"
                value={arrivalDateStr}
                onChange={handleArrivalChange}
                className="w-full bg-white border border-ids-border rounded px-1.5 py-1 text-[11px] font-mono font-black"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Day (Auto)
              </label>
              <input
                type="text"
                readOnly
                value={formatDayName(arrivalDateStr)}
                className="w-full bg-gray-100 border border-ids-border rounded px-1.5 py-1 text-[11px] text-center font-bold text-ids-header"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Nights
              </label>
              <input
                id="nights-input"
                type="number"
                min="1"
                value={nightsCount}
                onChange={handleNightsChange}
                className="w-full bg-white border border-ids-border rounded px-1.5 py-1 text-[11px] text-center font-mono font-black text-ids-sidebar"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Formatted
              </label>
              <div className="w-full bg-gray-100 border border-ids-border rounded px-1 py-1.5 text-[9px] text-center font-mono font-bold text-gray-500">
                {formatDateDisplay(arrivalDateStr)}
              </div>
            </div>
          </div>

          {/* DEPARTURE ROW */}
          <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2 rounded border border-ids-border/50">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Departure Date
              </label>
              <input
                id="departure-date-input"
                type="date"
                value={departureDateStr}
                onChange={handleDepartureChange}
                className="w-full bg-white border border-ids-border rounded px-1.5 py-1 text-[11px] font-mono font-black"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Day (Auto)
              </label>
              <input
                type="text"
                readOnly
                value={formatDayName(departureDateStr)}
                className="w-full bg-gray-100 border border-ids-border rounded px-1.5 py-1 text-[11px] text-center font-bold text-ids-header"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Formatted
              </label>
              <div className="w-full bg-gray-100 border border-ids-border rounded px-1 py-1.5 text-[9px] text-center font-mono font-bold text-gray-500">
                {formatDateDisplay(departureDateStr)}
              </div>
            </div>
          </div>

          {/* CORE FIELDS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Property Node
              </label>
              <select
                {...register("property")}
                className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-bold"
              >
                <option value="INNSYNC">INNSYNC TRAINING HOTEL (WOLISO)</option>
                <option value="MAIN">AMBO UNIVERSITY MAIN CAMPUS</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Company Profile Lookup
              </label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Direct Individual"
                  readOnly
                  value={companyName ? `${companyCode} - ${companyName}` : "Direct Booking"}
                  className="w-full bg-gray-100 border border-ids-border border-r-0 rounded-l px-2 py-1.5 font-bold truncate text-ids-sidebar"
                />
                <button
                  id="company-lookup-trigger-btn"
                  type="button"
                  onClick={() => setCompanyLookupOpen(true)}
                  className="px-3 bg-ids-sidebar text-white hover:bg-ids-sidebar-hover font-black text-sm rounded-r cursor-pointer transition-colors"
                  title="Search Corporate Index"
                >
                  ?
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Booker Type
              </label>
              <select
                {...register("booker_type")}
                className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-semibold"
              >
                <option value="Direct">Direct Client</option>
                <option value="Corporate">Corporate Profile</option>
                <option value="Travel Agent">Travel Agent</option>
                <option value="OTA">OTA (Booking.com/Expedia)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Booker Code
              </label>
              <input
                type="text"
                {...register("booker_code")}
                placeholder="BK-9021"
                className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Primary Contact Name
              </label>
              <input
                id="booker-name-field"
                type="text"
                {...register("booker_name")}
                placeholder="Guest Contact Full Name"
                className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Room Category Plan
              </label>
              <select
                id="room-type-select"
                {...register("room_type")}
                className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-black text-ids-sidebar"
              >
                <option value="DLX">DELUXE (DLX)</option>
                <option value="EXE">EXECUTIVE (EXE)</option>
                <option value="SUI">SUITE (SUI)</option>
                <option value="PNH">PENTHOUSE (PNH)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Reservation Mode
              </label>
              <select
                {...register("booking_mode")}
                className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-semibold"
              >
                <option value="Phone">Phone Call</option>
                <option value="Walk-in">Walk-in Direct</option>
                <option value="Email">Email Letter</option>
                <option value="Online">Online Website</option>
                <option value="Travel Agent">Travel Agent</option>
              </select>
            </div>

            <div className="flex items-end justify-center pb-1">
              <button
                type="button"
                onClick={() => setHousePlanActive(!housePlanActive)}
                className={`w-full py-1.5 text-[10px] font-black uppercase rounded tracking-wider border transition-all cursor-pointer ${
                  housePlanActive
                    ? "bg-ids-header text-white border-ids-header shadow-xs"
                    : "bg-white text-gray-400 border-gray-300"
                }`}
              >
                HP — HOUSE PLAN
              </button>
            </div>
          </div>

          {/* ROOMS + ADULT + CHILD ROW */}
          <div className="grid grid-cols-4 gap-3 bg-gray-50 p-2.5 rounded border border-ids-border/50">
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Rooms Count
              </label>
              <input
                type="number"
                min="1"
                {...register("rooms", { required: true, min: 1 })}
                className="w-full bg-white border border-ids-border rounded px-2 py-1 text-center font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Adults
              </label>
              <input
                type="number"
                min="1"
                {...register("adults", { required: true, min: 1 })}
                className="w-full bg-white border border-ids-border rounded px-2 py-1 text-center font-bold font-mono text-ids-sidebar"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Children
              </label>
              <input
                type="number"
                min="0"
                {...register("children")}
                className="w-full bg-white border border-ids-border rounded px-2 py-1 text-center font-bold font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => toast("All rooms of category are available for select!")}
                className="w-full py-1 bg-ids-sidebar text-white hover:bg-ids-sidebar-hover text-[10px] font-bold uppercase rounded cursor-pointer transition-colors"
              >
                Details
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
              Reservation Status
            </label>
            <select
              {...register("status")}
              className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-bold text-ids-header"
            >
              <option value="confirmed">Confirmed (Approved Room Blocks)</option>
              <option value="tentative">Tentative (Awaiting Deposit)</option>
              <option value="waitlist">Waitlisted (Fully Booked Block)</option>
            </select>
          </div>

          {/* GUEST TABLE INLINE GRID */}
          <GuestTable
            guests={guests}
            setGuests={setGuests}
            onTriggerLookup={handleTriggerGuestLookup}
          />

          {/* TARIFF DETAILS PREVIEW BAR */}
          <div className="bg-amber-50 border border-amber-200 rounded p-2.5 space-y-1">
            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
              Estimated Rate Plan Breakdown (Currency: INR ₹)
            </span>
            <div className="grid grid-cols-6 gap-1 text-center font-mono font-bold text-amber-950">
              <div className="bg-amber-100 p-1 rounded">
                <p className="text-[8px] uppercase font-sans text-amber-800">Single</p>
                <p className="text-[10px]">₹{rateSummary.single || "—"}</p>
              </div>
              <div className="bg-amber-100 p-1 rounded">
                <p className="text-[8px] uppercase font-sans text-amber-800">Double</p>
                <p className="text-[10px]">₹{rateSummary.double || "—"}</p>
              </div>
              <div className="bg-amber-100 p-1 rounded">
                <p className="text-[8px] uppercase font-sans text-amber-800">Triple</p>
                <p className="text-[10px]">₹{rateSummary.triple || "—"}</p>
              </div>
              <div className="bg-amber-100 p-1 rounded">
                <p className="text-[8px] uppercase font-sans text-amber-800">Quad</p>
                <p className="text-[10px]">₹{rateSummary.quad || "—"}</p>
              </div>
              <div className="bg-amber-100 p-1 rounded text-red-800">
                <p className="text-[8px] uppercase font-sans text-red-700">Tax</p>
                <p className="text-[10px]">₹{rateSummary.tax || "—"}</p>
              </div>
              <div className="bg-amber-100 p-1 rounded text-ids-sidebar">
                <p className="text-[8px] uppercase font-sans text-ids-sidebar">Ext Adult</p>
                <p className="text-[10px]">₹{rateSummary.ext_adult || "—"}</p>
              </div>
            </div>
          </div>

          {/* Bottom Actions Tray */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-ids-border/40 sticky bottom-0 bg-white py-2 shrink-0">
            <button
              type="button"
              onClick={onClose || (() => navigate("/app/reservations"))}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold uppercase rounded border border-ids-border tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="quick-res-save-btn"
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-black uppercase rounded tracking-wider flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save Reservation</span>
            </button>
            <button
              id="quick-res-proceed-btn"
              type="button"
              onClick={handleProceed}
              className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase rounded tracking-wider flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <span>Proceed Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>

      {/* Lookup Popups */}
      <CompanyLookup
        isOpen={companyLookupOpen}
        onClose={() => setCompanyLookupOpen(false)}
        onSelect={handleCompanySelect}
      />

      <GuestLookup
        isOpen={guestLookupOpen}
        onClose={() => setGuestLookupOpen(false)}
        onSelect={handleGuestSelect}
      />

      {/* Duplicate Guest Detection Modal */}
      <DuplicateGuestModal
        isOpen={duplicateGuestModalOpen}
        onClose={() => {}} // No close action - user must choose
        existingGuest={matchedGuest}
        enteredName={pendingReservationData?.guest_name || ""}
        onContinueExisting={handleContinueWithExistingGuest}
        onCreateNew={handleCreateNewGuest}
      />
    </div>
  );
};

export default QuickReservation;
