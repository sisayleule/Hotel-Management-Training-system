import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHotelStore } from "../store/useHotelStore.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { RateGrid } from "../components/reservations/RateGrid.jsx";
import { GuestTable } from "../components/reservations/GuestTable.jsx";
import { CompanyLookup } from "../components/reservations/CompanyLookup.jsx";
import { GuestLookup } from "../components/reservations/GuestLookup.jsx";
import { format, parseISO, addDays, differenceInDays, isValid } from "date-fns";
import {
  ArrowLeft,
  Save,
  Trash2,
  Calendar,
  CreditCard,
  Printer,
  Mail,
  UserCheck,
  LogOut,
  MapPin,
  Compass,
  FileText,
  User,
  Users,
  Moon,
  Ban,
  Eye,
  Home,
  CheckCircle,
  HelpCircle,
  FileEdit
} from "lucide-react";
import toast from "react-hot-toast";

export const DetailedReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Store actions & state
  const reservations = useHotelStore((state) => state.reservations);
  const updateReservation = useHotelStore((state) => state.updateReservation);
  const cancelReservation = useHotelStore((state) => state.cancelReservation);
  const checkOutGuest = useHotelStore((state) => state.checkOutGuest);

  // Find targeted reservation
  const reservation = useMemo(() => {
    return reservations.find((r) => r.reservation_no === id);
  }, [reservations, id]);

  // If not found, load defaults gracefully
  const resvNo = reservation?.reservation_no || id || "RES001";
  const [status, setStatus] = useState(reservation?.status || "confirmed");

  // Local editable states synced from reservation
  const [guestName, setGuestName] = useState(reservation?.guest_name || "Biswakarma Santosh");
  const [roomType, setRoomType] = useState(reservation?.room_type || "SUI");
  const [arrival, setArrival] = useState(reservation?.arrival || "2026-06-30");
  const [departure, setDeparture] = useState(reservation?.departure || "2026-07-02");
  const [nights, setNights] = useState(reservation?.nights || 2);
  const [adults, setAdults] = useState(reservation?.adults || 2);
  const [children, setChildren] = useState(reservation?.children || 0);
  const [payMode, setPayMode] = useState(reservation?.pay_mode || "Cash");
  const [rate, setRate] = useState(reservation?.rate || 7499);
  const [companyCode, setCompanyCode] = useState(reservation?.company_code || "COM0007");
  const [companyName, setCompanyName] = useState("Mahindra & Mahindra Limited");

  const [housePlan, setHousePlan] = useState(false);
  const [agentBill, setAgentBill] = useState(false);
  const [directPay, setDirectPay] = useState(false);

  // Address and Contact secondary states
  const [contactPhone, setContactPhone] = useState("022 28849514");
  const [contactEmail, setContactEmail] = useState("m.mahindra@corporate-mahindra.in");
  const [billingInstructions, setBillingInstructions] = useState("Direct Bill to Company");
  const [marketSegment, setMarketSegment] = useState("CV1");
  const [businessSource, setBusinessSource] = useState("MUM");

  // Dynamic Lookup Popups
  const [companyOpen, setCompanyOpen] = useState(false);
  const [guestLookupOpen, setGuestLookupOpen] = useState(false);
  const [guests, setGuests] = useState([
    { title: "Mr", last_name: "Biswakarma", middle_name: "", first_name: "Santosh" },
    { title: "Mrs", last_name: "Rai", middle_name: "", first_name: "Sangeeta" }
  ]);
  const [activeGuestIdx, setActiveGuestIdx] = useState(0);

  // Side Tab Panel selection
  const [activeTab, setActiveTab] = useState("guest-info");

  // Sync state if reservation loaded changes
  useEffect(() => {
    if (reservation) {
      setGuestName(reservation.guest_name);
      setRoomType(reservation.room_type);
      setArrival(reservation.arrival);
      setDeparture(reservation.departure);
      setNights(reservation.nights || 1);
      setAdults(reservation.adults || 1);
      setChildren(reservation.children || 0);
      setPayMode(reservation.pay_mode || "Cash");
      setRate(reservation.rate || 3500);
      setCompanyCode(reservation.company_code || "");
      setStatus(reservation.status || "confirmed");
    }
  }, [reservation]);

  // Select Rate details handler
  const handleSelectRatePlan = (selectedType, activeRate) => {
    setRoomType(selectedType.replace("_PLAN", ""));
    setRate(activeRate);
    toast.success(`Category Plan updated to ${selectedType} @ ₹${activeRate}/night`);
  };

  // Company selection callback
  const handleCompanySelected = (comp) => {
    setCompanyCode(comp.code);
    setCompanyName(comp.name);
    setPayMode("Direct Bill");
    setBillingInstructions(`Direct Bill to ${comp.name}`);
    toast.success(`Billing routed to corporate: ${comp.name}`);
  };

  // Guest lookup callback
  const handleGuestLookupSelected = (profile) => {
    const updated = [...guests];
    updated[activeGuestIdx] = {
      title: profile.title || "Mr",
      last_name: profile.last_name || "",
      middle_name: profile.middle_name || "",
      first_name: profile.first_name || ""
    };
    setGuests(updated);

    if (activeGuestIdx === 0) {
      setGuestName(`${profile.first_name} ${profile.last_name}`.trim());
    }
    toast.success("Guest profile loaded into registry");
  };

  // Action flow workflow buttons
  const handleCheckInWorkflow = () => {
    // Delegate entirely to the dedicated Check-In module
    navigate(`/app/checkin?id=${resvNo}`);
  };

  const handleCheckOutWorkflow = () => {
    checkOutGuest(resvNo);
    toast.success(`Guest successfully checked-out. Room set to DIRTY.`);
    navigate("/app/reservations");
  };

  const handleCancelWorkflow = () => {
    // Navigate to dedicated cancel booking page
    navigate(`/app/reservations/cancel?id=${resvNo}`);
  };

  return (
    <PageWrapper>
      <div className="text-xs font-sans text-gray-800 space-y-4" id="detailed-reservation-pms-page">
      
      {/* Top Breadcrumb Nav & Title */}
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
              <span className="text-ids-header font-black">#{resvNo} — {guestName}</span>
            </div>
            <h1 className="text-base font-black text-ids-sidebar tracking-tight mt-0.5">
              Detailed Reservation / Make V6.5.002.20
            </h1>
          </div>
        </div>

        {/* Fortune IDS top toolbar person icons */}
        <div className="flex items-center space-x-2 bg-gray-50 p-2 border border-ids-border/60 rounded">
          <User className="w-4 h-4 text-gray-400 hover:text-ids-sidebar shrink-0 cursor-pointer" title="Single" />
          <Users className="w-4 h-4 text-gray-400 hover:text-ids-sidebar shrink-0 cursor-pointer" title="Couple" />
          <Ban onClick={handleCancelWorkflow} className="w-4 h-4 text-red-400 hover:text-red-600 shrink-0 cursor-pointer" title="Cancel Reservation" />
          <Eye className="w-4 h-4 text-gray-400 hover:text-ids-sidebar shrink-0 cursor-pointer" title="View Logs" />
          <Home onClick={() => navigate(`/reservations/assign?id=${resvNo}`)} className="w-4 h-4 text-green-500 hover:text-green-600 shrink-0 cursor-pointer" title="Assign Room Grid" />
          <Users className="w-4 h-4 text-gray-400 hover:text-ids-sidebar shrink-0 cursor-pointer" title="Family Plan" />
          <Moon className="w-4 h-4 text-indigo-400 hover:text-indigo-600 shrink-0 cursor-pointer" title="Nights Matrix" />
        </div>
      </div>

      {/* Main Grid Layout: Left Column & Right Column */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN — RESERVATION DETAILS (col-span-6) */}
        <div className="xl:col-span-6 space-y-4">
          <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-4 select-none">
            
            <div className="border-b border-ids-border pb-1.5 flex justify-between items-center">
              <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider">
                Booking Information
              </h3>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-mono font-black">
                RESV #{resvNo}
              </span>
            </div>

            {/* DATES ROW */}
            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded border border-ids-border/50 font-mono font-bold">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Arrival</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-1.5 py-1 text-[11px] font-mono font-black text-ids-header">
                  {arrival}
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Nights</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-1.5 py-1 text-[11px] text-center font-mono font-black text-ids-header">
                  {nights}
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Departure</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-1.5 py-1 text-[11px] font-mono font-black text-ids-header">
                  {departure}
                </div>
              </div>
            </div>

            {/* PROPERTY & COMPANY */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Property</label>
                <select className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold">
                  <option value="DEMO">DEMO HOTEL (GUWAHATI)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Corporate Profile</label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={companyCode ? `${companyCode} - ${companyName}` : "Walk-in Direct"}
                    className="w-full bg-gray-100 border border-ids-border border-r-0 rounded-l px-2 py-1.5 font-bold truncate"
                  />
                  <button
                    onClick={() => setCompanyOpen(true)}
                    className="px-2.5 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white rounded-r font-black cursor-pointer"
                  >
                    ?
                  </button>
                </div>
              </div>
            </div>

            {/* BOOKER DETAILS */}
            <div className="grid grid-cols-3 gap-3 select-none">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Booker Type</label>
                <input
                  type="text"
                  readOnly
                  value={companyCode ? "Corporate" : "Direct Individual"}
                  className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Booker Code</label>
                <input
                  type="text"
                  readOnly
                  value={companyCode ? "CORP-901" : "—"}
                  className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-mono text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Booker Name</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-extrabold text-ids-sidebar">
                  {guestName}
                </div>
              </div>
            </div>

            {/* ROOM DETAILS & OCCUPANCY */}
            <div className="grid grid-cols-4 gap-2.5 items-end">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Category</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-2 py-1.5 font-black text-ids-sidebar text-center">
                  <span className="px-2 py-0.5 bg-gray-200 rounded uppercase">
                    {roomType}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Adults</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1 text-center font-black text-ids-header">
                  {adults}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Children</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1 text-center font-black text-ids-header">
                  {children}
                </div>
              </div>
            </div>

            {/* QUICK TOGGLE OPTIONS */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setHousePlan(!housePlan)}
                className={`py-1 rounded text-[9px] font-black uppercase tracking-wider border ${
                  housePlan ? "bg-ids-sidebar text-white border-ids-sidebar" : "bg-white text-gray-400 border-gray-200"
                }`}
              >
                HP (House Plan)
              </button>
              <button
                onClick={() => setAgentBill(!agentBill)}
                className={`py-1 rounded text-[9px] font-black uppercase tracking-wider border ${
                  agentBill ? "bg-ids-sidebar text-white border-ids-sidebar" : "bg-white text-gray-400 border-gray-200"
                }`}
              >
                AG (Agent Comm)
              </button>
              <button
                onClick={() => setDirectPay(!directPay)}
                className={`py-1 rounded text-[9px] font-black uppercase tracking-wider border ${
                  directPay ? "bg-ids-sidebar text-white border-ids-sidebar" : "bg-white text-gray-400 border-gray-200"
                }`}
              >
                DP (Direct Pay)
              </button>
            </div>

            {/* STATUS & TARIFF RATE BOX */}
            <div className="grid grid-cols-3 gap-3.5 items-end bg-amber-50 border border-amber-200 rounded p-2.5">
              <div className="col-span-2">
                <label className="block text-[9px] font-bold text-amber-900 uppercase mb-1">Tariff Selection Mode</label>
                <div className="font-mono text-xs font-black text-amber-950">
                  ₹{rate} INR per Night (excluding 12% GST)
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => toast("Rates are fully synced with Rate Grid details below!")}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[10px] rounded tracking-wide cursor-pointer"
                >
                  TARIFF
                </button>
              </div>
            </div>

            {/* GUEST LIST GRID */}
            <GuestTable
              guests={guests}
              setGuests={setGuests}
              onTriggerLookup={(idx) => {
                setActiveGuestIdx(idx);
                setGuestLookupOpen(true);
              }}
            />

            {/* BOTTOM PMS CODES INPUT FORM GRID */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-ids-border/40 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Billing Instructions</label>
                <select
                  value={billingInstructions}
                  onChange={(e) => setBillingInstructions(e.target.value)}
                  className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-bold"
                >
                  <option value="Direct Bill to Company">Direct Bill to Company</option>
                  <option value="Self Settlement">Self Settlement</option>
                  <option value="Prepaid Voucher">Prepaid Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Method</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-2 py-1.5 font-bold text-ids-sidebar">
                  {payMode}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Market Segment</label>
                <select
                  value={marketSegment}
                  onChange={(e) => setMarketSegment(e.target.value)}
                  className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-bold"
                >
                  <option value="CV1">CV1 (Corporate Contract)</option>
                  <option value="FIT">FIT (Free Individual Traveler)</option>
                  <option value="OTA">OTA (Online Travel Agent)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Business Source</label>
                <select
                  value={businessSource}
                  onChange={(e) => setBusinessSource(e.target.value)}
                  className="w-full bg-white border border-ids-border rounded px-2 py-1.5 font-bold"
                >
                  <option value="MUM">MUM (Mumbai Corporate Office)</option>
                  <option value="CAL">CAL (Kolkata Sales Depot)</option>
                  <option value="DEL">DEL (Delhi HQ Node)</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN — PROFILE & GEOGRAPHIC DETAILS (col-span-6) */}
        <div className="xl:col-span-6 space-y-4">
          
          {/* Company Details profile block */}
          <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-3.5 select-none">
            <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider border-b border-ids-border pb-1.5">
              Company & Billing Profile
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company Code</label>
                <input
                  type="text"
                  readOnly
                  value={companyCode || "WALK-IN"}
                  className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-mono font-black text-ids-header text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Registered Name</label>
                <input
                  type="text"
                  readOnly
                  value={companyCode ? companyName : "Direct Individual Walk-in"}
                  className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-extrabold text-ids-sidebar truncate"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Contact Phone</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold text-gray-700">
                  {contactPhone}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">E-mail address</label>
                <div className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-bold text-ids-sidebar truncate">
                  {contactEmail}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Physical Billing Address</label>
              <input
                type="text"
                readOnly
                value={companyCode ? "Mahindra & Mahindra Ltd. Auto Div.," : "Guest Home Residence Address"}
                className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-medium text-gray-600 mb-1"
              />
              <input
                type="text"
                readOnly
                value={companyCode ? "C/o Crystal grove 2nd floor, Guwahati" : "—"}
                className="w-full bg-gray-100 border border-ids-border rounded px-2.5 py-1.5 font-medium text-gray-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">City</label>
                <div className="bg-gray-100 border border-ids-border rounded py-1.5 font-black text-gray-700">GUWAHATI</div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">State</label>
                <div className="bg-gray-100 border border-ids-border rounded py-1.5 font-black text-gray-700">IN-AS</div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Zip Code</label>
                <div className="bg-gray-100 border border-ids-border rounded py-1.5 font-mono font-black text-gray-700">781028</div>
              </div>
            </div>
          </div>

          {/* SIDE TAB MODULES: vertical tabs on desktop, horizontal scroll on mobile */}
          <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden flex flex-col md:flex-row md:min-h-[240px] select-none">
            
            {/* Tabs List */}
            <div className="bg-gray-50 border-r border-ids-border/60 flex flex-row md:flex-col shrink-0 overflow-x-auto overflow-y-hidden md:overflow-y-auto divide-x md:divide-x-0 md:divide-y divide-ids-border/30 w-full md:w-40">
              <button
                type="button"
                onClick={() => setActiveTab("guest-info")}
                className={`px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wide cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                  activeTab === "guest-info" ? "bg-white text-ids-header border-l-2 border-ids-header font-black" : "text-gray-500 hover:bg-gray-100/60"
                }`}
              >
                <span>📋 Guest Information</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("transport")}
                className={`px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wide cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                  activeTab === "transport" ? "bg-white text-ids-header border-l-2 border-ids-header font-black" : "text-gray-500 hover:bg-gray-100/60"
                }`}
              >
                <span>🚗 Pickup & Drop</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("card-info")}
                className={`px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wide cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                  activeTab === "card-info" ? "bg-white text-ids-header border-l-2 border-ids-header font-black" : "text-gray-500 hover:bg-gray-100/60"
                }`}
              >
                <span>💳 Cards & Privileges</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("passport")}
                className={`px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wide cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                  activeTab === "passport" ? "bg-white text-ids-header border-l-2 border-ids-header font-black" : "text-gray-500 hover:bg-gray-100/60"
                }`}
              >
                <span>🛂 Passport & Visa</span>
              </button>
            </div>

            {/* Tab Pane Body */}
            <div className="p-4 flex-1 overflow-y-auto">
              {activeTab === "guest-info" && (
                <div className="space-y-2.5">
                  <p className="font-bold text-ids-sidebar text-[11px] uppercase tracking-wider mb-2 border-b border-ids-border/30 pb-1">Historical Profile Logs</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide block">Guest ID Number</span>
                      <span className="text-xs text-ids-sidebar font-mono font-black">G-209-A</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide block">Profile Status</span>
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-black rounded border border-green-200">REGULAR FIT</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide block">Last Stay Date</span>
                      <span className="text-xs text-gray-700 font-mono font-bold">12-MAR-2026</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide block">Total historical stays</span>
                      <span className="text-xs text-gray-700 font-bold">14 Visits</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "transport" && (
                <div className="space-y-2 text-gray-600 font-medium">
                  <p className="font-bold text-ids-sidebar text-[11px] uppercase tracking-wider border-b border-ids-border/30 pb-1">Transport Arrangements</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Pickup Required?</span>
                      <span className="font-black text-ids-sidebar">YES — Toyota Innova</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Flight Node</span>
                      <span className="font-mono font-bold">6E-201 (Indigo Airlines)</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Arrival ETA</span>
                      <span className="font-mono font-bold">19:50 hrs</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Billing remarks</span>
                      <span className="font-bold text-indigo-700">Charged to Corporate</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "card-info" && (
                <div className="space-y-2">
                  <p className="font-bold text-ids-sidebar text-[11px] uppercase tracking-wider border-b border-ids-border/30 pb-1">Loyalty Privilege Profiles</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Club membership level</span>
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase rounded inline-block">FORTUNE COLD CLUB</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Member card No.</span>
                      <span className="font-mono font-bold">GLD-90082726</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "passport" && (
                <div className="space-y-2">
                  <p className="font-bold text-ids-sidebar text-[11px] uppercase tracking-wider border-b border-ids-border/30 pb-1">Foreign Nationality Records</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Passport Number</span>
                      <span className="font-mono font-bold text-ids-sidebar">Z-109282918</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Visa Expiry Date</span>
                      <span className="font-mono font-bold">14-DEC-2027</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* TARIFF PLANS DETAIL MATRIX (Rate Details table at bottom) */}
      <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs">
        <RateGrid
          selectedRoomType={roomType}
          onSelectRatePlan={handleSelectRatePlan}
        />
      </div>

      {/* DYNAMIC ACTION WORKFLOW BUTTONS */}
      <div className="bg-white border border-ids-border rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 select-none shrink-0 shadow-2xs">
        
        {/* Status indicator info */}
        <div className="flex items-center space-x-2.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Reservation Status Workflow:</span>
          {status === "confirmed" && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded border border-blue-200 uppercase">
              Confirmed Block (Pending Arrival)
            </span>
          )}
          {status === "checked_in" && (
            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-black rounded border border-green-200 uppercase">
              In-House Guest (Active Room Key)
            </span>
          )}
          {status === "checked_out" && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-black rounded border border-gray-200 uppercase">
              Settled Folio (Historical Record)
            </span>
          )}
        </div>

        {/* Adaptive buttons row */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Confirmed Workflow Action Buttons */}
          {status === "confirmed" && (
            <>
              <button
                id="amend-booking-btn"
                onClick={() => navigate(`/reservations/amend?id=${resvNo}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <FileEdit className="w-4 h-4 text-white" />
                <span>✏️ Amend This Booking</span>
              </button>
              <button
                id="check-in-workflow-btn"
                onClick={handleCheckInWorkflow}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-white" />
                <span>✅ Check-In Guest</span>
              </button>
              <button
                id="assign-room-workflow-btn"
                onClick={() => navigate(`/app/reservations/assign?id=${resvNo}`)}
                className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 text-yellow-400" />
                <span>📋 Assign Room</span>
              </button>
              <button
                onClick={handleCancelWorkflow}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>❌ Cancel Resv</span>
              </button>
            </>
          )}

          {/* Checked-In Active In-House Workflow Action Buttons */}
          {status === "checked_in" && (
            <>
              <button
                id="amend-booking-checked-in-btn"
                onClick={() => navigate(`/reservations/amend?id=${resvNo}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <FileEdit className="w-4 h-4 text-white" />
                <span>✏️ Amend Booking</span>
              </button>
              <button
                id="check-out-workflow-btn"
                onClick={handleCheckOutWorkflow}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>🚪 Check-Out Guest</span>
              </button>
              <button
                onClick={() => {
                  toast.success("Post Charge success: Room Charge posted to primary folio");
                }}
                className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-white" />
                <span>💳 Post Charge</span>
              </button>
              <button
                onClick={() => toast.success("Draft Folio sent to printer cue...")}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-gray-500" />
                <span>🖨 Print Folio</span>
              </button>
            </>
          )}

          {/* Checked-Out Settled Workflow Action Buttons */}
          {status === "checked_out" && (
            <>
              <button
                onClick={() => toast.success("Tax Invoice sent to printer queue...")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>🖨 Print Invoice</span>
              </button>
              <button
                onClick={() => toast("Displaying read-only Folio summary...")}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-gray-500" />
                <span>📄 View Folio</span>
              </button>
            </>
          )}

        </div>

      </div>

      {/* Popups */}
      <CompanyLookup
        isOpen={companyOpen}
        onClose={() => setCompanyOpen(false)}
        onSelect={handleCompanySelected}
      />

      <GuestLookup
        isOpen={guestLookupOpen}
        onClose={() => setGuestLookupOpen(false)}
        onSelect={handleGuestLookupSelected}
      />

      </div>
    </PageWrapper>
  );
};

export default DetailedReservation;
