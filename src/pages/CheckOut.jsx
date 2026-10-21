import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHotelStore, getAssignedRoom } from "../store/useHotelStore.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { ReservationStatusBadge } from "../components/reservations/ReservationStatusBadge.jsx";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";
import { format, parseISO, isValid } from "date-fns";
import {
  ArrowLeft, Search, X, LogOut, AlertTriangle,
  CheckCircle, User, Calendar, Moon, Users, DollarSign,
  CreditCard, Printer, RefreshCw, MapPin
} from "lucide-react";
import toast from "react-hot-toast";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  try { const p = parseISO(d); return isValid(p) ? format(p, "dd-MMM-yyyy") : d; }
  catch { return d; }
};

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(Number(n) || 0);

const roomStatusLabel = (status) => {
  switch (status) {
    case "occupied":       return { label: "Occupied",       color: "text-red-700 bg-red-50 border-red-200" };
    case "dirty":          return { label: "Dirty",          color: "text-orange-700 bg-orange-50 border-orange-200" };
    case "vacant_clean":   return { label: "Vacant Clean",   color: "text-green-700 bg-green-50 border-green-200" };
    case "reservation":    return { label: "Reserved",       color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
    case "out_of_order":   return { label: "Out of Order",   color: "text-blue-700 bg-blue-50 border-blue-200" };
    default:               return { label: status || "Unknown", color: "text-gray-700 bg-gray-50 border-gray-200" };
  }
};

const calcFolio = (res) => {
  const totalCharges  = Number(res.total_amount) || 0;
  const totalPayments = (res.payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const balance       = totalCharges - totalPayments;
  return { totalCharges, totalPayments, balance };
};

// ─── component ────────────────────────────────────────────────────────────────
export const CheckOut = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const reservations    = useHotelStore((s) => s.reservations);
  const rooms           = useHotelStore((s) => s.rooms);
  const guests          = useHotelStore((s) => s.guests);
  const selectedDate    = useHotelStore((s) => s.selectedDate);
  const performCheckOut = useHotelStore((s) => s.performCheckOut);
  const postPayment     = useHotelStore((s) => s.postPayment);

  // ── tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState("departures");

  // ── search ────────────────────────────────────────────────────────────────
  const [resNoSearch,   setResNoSearch]   = useState("");
  const [guestSearch,   setGuestSearch]   = useState("");
  const [phoneSearch,   setPhoneSearch]   = useState("");
  const [roomSearch,    setRoomSearch]    = useState("");
  const [depSearch,     setDepSearch]     = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searched,      setSearched]      = useState(false);

  // ── selected reservation flow ─────────────────────────────────────────────
  const [selectedRes,    setSelectedRes]    = useState(null);
  const [confirmStep,    setConfirmStep]    = useState(false);
  const [doneState,      setDoneState]      = useState(null); // { roomNo }
  const [isProcessing,   setIsProcessing]   = useState(false);

  // ── payment form ──────────────────────────────────────────────────────────
  const [payAmount,  setPayAmount]  = useState("");
  const [payMethod,  setPayMethod]  = useState("Cash");
  const [payPosting, setPayPosting] = useState(false);

  // ── lists ─────────────────────────────────────────────────────────────────
  const todaysDepartures = useMemo(
    () => reservations.filter(r => r.departure === selectedDate && r.status === "checked_in"),
    [reservations, selectedDate]
  );
  const inHouseGuests = useMemo(
    () => reservations.filter(r => r.status === "checked_in"),
    [reservations]
  );

  // ── deep-link: ?id=RESxxx ────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id") || params.get("reservationNo");
    if (id) {
      const found = reservations.find(r => r.reservation_no === id);
      if (found) { setSelectedRes(found); setConfirmStep(false); setDoneState(null); }
      else toast.error(`Reservation ${id} not found`);
    }
  }, [location.search, reservations]);

  // ── Enter-as-Tab ──────────────────────────────────────────────────────────
  const searchRef = useEnterAsTab({ onSubmit: (e) => { e.preventDefault(); handleSearch(); } });

  // ── search handler ────────────────────────────────────────────────────────
  const handleSearch = () => {
    let results = [...reservations];
    if (resNoSearch.trim())
      results = results.filter(r => r.reservation_no.toLowerCase().includes(resNoSearch.trim().toLowerCase()));
    if (guestSearch.trim())
      results = results.filter(r => r.guest_name.toLowerCase().includes(guestSearch.trim().toLowerCase()));
    if (phoneSearch.trim()) {
      const q = phoneSearch.trim();
      results = results.filter(r => {
        const g = guests.find(gg => gg.guest_name === r.guest_name);
        return g && g.phone.includes(q);
      });
    }
    if (roomSearch.trim())
      results = results.filter(r =>
        (r.rooms_assigned || []).includes(roomSearch.trim()) ||
        rooms.some(rm => rm.room_no === roomSearch.trim() && rm.reservation_no === r.reservation_no)
      );
    if (depSearch) results = results.filter(r => r.departure === depSearch);
    setSearchResults(results);
    setSearched(true);
    if (results.length === 1) { setSelectedRes(results[0]); setConfirmStep(false); setDoneState(null); }
    else if (results.length === 0) toast.error("No reservations found");
  };

  const handleClear = () => {
    setResNoSearch(""); setGuestSearch(""); setPhoneSearch("");
    setRoomSearch(""); setDepSearch("");
    setSearchResults([]); setSearched(false);
  };

  const handleSelectFromList = (res) => {
    setSelectedRes(res); setConfirmStep(false); setDoneState(null); setSearchResults([]);
  };

  const handleBack = () => {
    setSelectedRes(null); setConfirmStep(false); setDoneState(null); handleClear();
    navigate("/app/checkout", { replace: true });
  };

  // ── payment posting ───────────────────────────────────────────────────────
  const handlePostPayment = async (e) => {
    e.preventDefault();
    if (!liveRes) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    const { balance } = calcFolio(liveRes);
    if (amt > balance + 0.01) { toast.error(`Amount exceeds balance of ${fmtCurrency(balance)}`); return; }
    setPayPosting(true);
    postPayment(liveRes.reservation_no, amt, payMethod);
    toast.success(`Payment of ${fmtCurrency(amt)} posted via ${payMethod} ✓`);
    setPayPosting(false);
    setPayAmount("");
  };

  // ── confirm check-out ─────────────────────────────────────────────────────
  const handleConfirmCheckOut = async () => {
    if (!liveRes) return;
    setIsProcessing(true);
    const result = await performCheckOut(liveRes.reservation_no);
    setIsProcessing(false);
    if (result.success) {
      toast.success(`Reservation ${liveRes.reservation_no} checked out. Room ${result.roomNo} is now Dirty.`, { duration: 5000 });
      setDoneState({ roomNo: result.roomNo, resNo: liveRes.reservation_no, guestName: liveRes.guest_name });
      setConfirmStep(false);
    } else {
      toast.error(result.error, { duration: 6000 });
    }
  };

  // ── live derived values ───────────────────────────────────────────────────
  const liveRes = selectedRes
    ? (reservations.find(r => r.reservation_no === selectedRes.reservation_no) || selectedRes)
    : null;

  const folio          = liveRes ? calcFolio(liveRes) : null;
  const assignedRoomNo = liveRes ? getAssignedRoom(liveRes, rooms) : null;
  const assignedRoom   = assignedRoomNo ? rooms.find(r => r.room_no === assignedRoomNo) : null;
  const roomSt         = assignedRoom ? roomStatusLabel(assignedRoom.status) : null;

  const isNotCheckedIn = liveRes && liveRes.status !== "checked_in";
  const isDepToday     = liveRes ? liveRes.departure === selectedDate : false;
  const isEarlyDep     = liveRes && !isDepToday && liveRes.departure > selectedDate;
  const isLateDep      = liveRes && !isDepToday && liveRes.departure < selectedDate;
  const balanceClear   = folio ? folio.balance <= 0 : false;

  // pre-fill payment amount when reservation is selected
  useEffect(() => {
    if (folio && folio.balance > 0) setPayAmount(String(folio.balance));
    else setPayAmount("");
  }, [liveRes?.reservation_no, folio?.balance]);

  // ── list row renderer ─────────────────────────────────────────────────────
  const ListRow = ({ res }) => {
    const ar     = getAssignedRoom(res, rooms);
    const f      = calcFolio(res);
    return (
      <tr className="hover:bg-ids-bg/30 cursor-pointer transition-colors border-b border-ids-border/40"
          onClick={() => handleSelectFromList(res)}>
        <td className="px-4 py-3 font-mono font-black text-ids-header text-xs">{res.reservation_no}</td>
        <td className="px-4 py-3 font-bold text-gray-700 text-xs">{res.guest_name}</td>
        <td className="px-4 py-3 font-semibold text-gray-500 text-xs">{res.room_type}</td>
        <td className="px-4 py-3 text-xs">
          {ar
            ? <span className="font-mono font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px]">Room {ar}</span>
            : <span className="text-gray-400 text-[10px]">—</span>}
        </td>
        <td className="px-4 py-3 font-mono text-gray-500 text-xs">{fmtDate(res.departure)}</td>
        <td className={`px-4 py-3 font-mono font-black text-xs text-right ${f.balance > 0 ? "text-red-600" : "text-green-600"}`}>
          {fmtCurrency(f.balance)}
        </td>
        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
          <button onClick={() => handleSelectFromList(res)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded flex items-center space-x-1 mx-auto cursor-pointer">
            <LogOut className="w-3 h-3" /><span>Check Out</span>
          </button>
        </td>
      </tr>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <div className="text-xs font-sans text-gray-800 space-y-4" id="checkout-module-page">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ids-border pb-3 gap-3 select-none">
          <div className="flex items-center space-x-3">
            {(liveRes || doneState) && (
              <button onClick={handleBack} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="text-gray-400 font-bold uppercase text-[9px] tracking-wider flex items-center space-x-1">
                <span>Front Office</span><span>&gt;</span>
                <span className="text-ids-header font-black">Check Out</span>
              </div>
              <h1 className="text-base font-black text-ids-sidebar tracking-tight mt-0.5">
                Guest Check-Out Module / V6.5
              </h1>
            </div>
          </div>
          <div className="text-[10px] font-mono font-bold text-gray-400 text-right">
            Hotel Date: <span className="text-ids-header">{selectedDate}</span>
          </div>
        </div>

        {/* ══ SUCCESS STATE ═══════════════════════════════════════════════════ */}
        {doneState && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-6 text-center space-y-4 shadow-3xs">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-black text-green-800 text-sm uppercase tracking-wide">Check-Out Complete</h3>
              <p className="text-green-700 font-semibold text-[11px] mt-1">
                {doneState.guestName} ({doneState.resNo}) has been checked out.
                Room {doneState.roomNo} is now <strong>Dirty</strong>.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold uppercase text-[11px] rounded flex items-center space-x-1.5 cursor-pointer">
                <Printer className="w-4 h-4" /><span>Print Receipt</span>
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-bold uppercase text-[11px] rounded flex items-center space-x-1.5 cursor-pointer">
                <RefreshCw className="w-4 h-4" /><span>Check Out Another Guest</span>
              </button>
            </div>
          </div>
        )}

        {/* ══ LIST MODE (no reservation selected, no done state) ══════════════ */}
        {!liveRes && !doneState && (
          <>
            {/* Three tabs */}
            <div className="flex border-b border-ids-border select-none">
              {[
                { id: "departures", label: `Today's Departures (${todaysDepartures.length})` },
                { id: "inhouse",    label: `In-House Guests (${inHouseGuests.length})` },
                { id: "search",     label: "Search" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
                    activeTab === tab.id
                      ? "border-ids-sidebar text-ids-sidebar"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Today's Departures */}
            {activeTab === "departures" && (
              <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden">
                <div className="bg-ids-sidebar text-white px-4 py-2.5 font-black text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>Today's Departures — {selectedDate}</span></div>
                  <span className="bg-white/20 px-2 py-0.5 rounded font-mono">{todaysDepartures.length} expected</span>
                </div>
                {todaysDepartures.length === 0
                  ? <div className="p-8 text-center text-gray-400 font-bold uppercase text-[11px]">No departures scheduled for today</div>
                  : <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 border-b border-ids-border">
                        <tr>
                          {["Res No.", "Guest", "Type", "Room", "Departure", "Balance", "Action"].map(h => (
                            <th key={h} className={`px-4 py-2.5 font-black text-ids-sidebar text-[10px] uppercase ${h === "Balance" || h === "Action" ? "text-right" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>{todaysDepartures.map(r => <ListRow key={r.reservation_no} res={r} />)}</tbody>
                    </table></div>
                }
              </div>
            )}

            {/* In-House Guests */}
            {activeTab === "inhouse" && (
              <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden">
                <div className="bg-ids-sidebar text-white px-4 py-2.5 font-black text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center space-x-2"><User className="w-4 h-4" /><span>All In-House Guests</span></div>
                  <span className="bg-white/20 px-2 py-0.5 rounded font-mono">{inHouseGuests.length} in-house</span>
                </div>
                {inHouseGuests.length === 0
                  ? <div className="p-8 text-center text-gray-400 font-bold uppercase text-[11px]">No guests currently in-house</div>
                  : <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 border-b border-ids-border">
                        <tr>
                          {["Res No.", "Guest", "Type", "Room", "Departure", "Balance", "Action"].map(h => (
                            <th key={h} className={`px-4 py-2.5 font-black text-ids-sidebar text-[10px] uppercase ${h === "Balance" || h === "Action" ? "text-right" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>{inHouseGuests.map(r => <ListRow key={r.reservation_no} res={r} />)}</tbody>
                    </table></div>
                }
              </div>
            )}

            {/* Search tab */}
            {activeTab === "search" && (
              <>
                <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-4">
                  <div className="border-b border-ids-border pb-2">
                    <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider">🔍 Search Reservations</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">All fields optional — AND logic. Press Enter to advance.</p>
                  </div>
                  <form ref={searchRef} onSubmit={e => { e.preventDefault(); handleSearch(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reservation No.</label>
                        <input type="text" value={resNoSearch} onChange={e => setResNoSearch(e.target.value)} placeholder="RES001"
                          className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-ids-header" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Guest Name</label>
                        <input type="text" value={guestSearch} onChange={e => setGuestSearch(e.target.value)} placeholder="Partial match"
                          className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-ids-header" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                        <input type="text" value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} placeholder="Partial match"
                          className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-ids-header" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Number</label>
                        <input type="text" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} placeholder="e.g. 301"
                          className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-ids-header" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Departure Date</label>
                        <input type="date" value={depSearch} onChange={e => setDepSearch(e.target.value)}
                          className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-ids-header" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-3 border-t border-ids-border/50 mt-3">
                      <button type="button" onClick={handleClear}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase text-[11px] rounded tracking-wider transition-colors cursor-pointer flex items-center space-x-1">
                        <X className="w-3.5 h-3.5" /><span>Clear</span>
                      </button>
                      <button type="submit"
                        className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer">
                        <Search className="w-4 h-4" /><span>Search</span>
                      </button>
                    </div>
                  </form>
                </div>

                {searchResults.length >= 2 && (
                  <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-3">
                    <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider border-b border-ids-border pb-2">
                      {searchResults.length} Reservations Found
                    </h3>
                    <div className="space-y-2">
                      {searchResults.map(res => {
                        const ar = getAssignedRoom(res, rooms);
                        const f  = calcFolio(res);
                        return (
                          <div key={res.reservation_no}
                            className="bg-gray-50 border border-ids-border rounded-lg p-3 flex items-center justify-between hover:bg-amber-50/40 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-black text-ids-header text-xs">{res.reservation_no}</span>
                                <ReservationStatusBadge status={res.status} />
                              </div>
                              <div className="font-bold text-ids-sidebar">{res.guest_name}</div>
                              <div className="text-[10px] text-gray-500 font-mono font-bold">
                                Departure: {fmtDate(res.departure)} · Room: {ar || "—"} · Balance: {fmtCurrency(f.balance)}
                              </div>
                            </div>
                            <button onClick={() => handleSelectFromList(res)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase text-[10px] rounded tracking-wide cursor-pointer flex items-center space-x-1 shrink-0">
                              <LogOut className="w-3 h-3" /><span>Select →</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searched && searchResults.length === 0 && (
                  <div className="bg-white border border-ids-border rounded-lg p-8 text-center shadow-3xs">
                    <p className="text-gray-400 font-bold uppercase text-[11px]">No reservations found</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══ DETAIL + FOLIO + CHECKOUT FLOW ══════════════════════════════════ */}
        {liveRes && !doneState && (
          <div className="space-y-4">

            {/* Status blocker */}
            {isNotCheckedIn && (
              <div className={`rounded-lg border p-4 flex items-start space-x-3 ${
                liveRes.status === "confirmed" ? "bg-blue-50 border-blue-300" : "bg-red-50 border-red-300"
              }`}>
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${liveRes.status === "confirmed" ? "text-blue-500" : "text-red-500"}`} />
                <div>
                  <p className={`font-black uppercase text-[11px] tracking-wide ${liveRes.status === "confirmed" ? "text-blue-700" : "text-red-700"}`}>
                    Check-Out Not Allowed
                  </p>
                  <p className={`font-semibold text-[11px] mt-1 ${liveRes.status === "confirmed" ? "text-blue-600" : "text-red-600"}`}>
                    {liveRes.reservation_no} is <strong>{liveRes.status.replace("_", " ").toUpperCase()}</strong>
                    {liveRes.status === "confirmed" && " — the guest has not checked in yet."}
                    {liveRes.status === "checked_out" && " — already checked out."}
                    {liveRes.status === "cancelled" && " — this booking was cancelled."}
                  </p>
                  {liveRes.status === "confirmed" && (
                    <button onClick={() => navigate(`/app/checkin?id=${liveRes.reservation_no}`)}
                      className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] rounded cursor-pointer">
                      Go to Check In →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Date mismatch warning */}
            {!isNotCheckedIn && !isDepToday && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-amber-800 font-bold text-[11px]">
                  {isEarlyDep
                    ? `Early departure — scheduled ${fmtDate(liveRes.departure)}, today is ${selectedDate}. Check-out is allowed for training.`
                    : `Late departure — was due ${fmtDate(liveRes.departure)}, today is ${selectedDate}. Check-out is allowed for training.`}
                </p>
              </div>
            )}

            {/* Reservation summary */}
            <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-4">
              <div className="flex items-center justify-between border-b border-ids-border pb-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-ids-header" />
                  <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider">Reservation Detail</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-ids-header text-[11px]">{liveRes.reservation_no}</span>
                  <ReservationStatusBadge status={liveRes.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Guest Name</span>
                  <span className="font-black text-ids-sidebar text-xs">{liveRes.guest_name}</span></div>
                <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Room Type</span>
                  <span className="font-mono font-black text-ids-header text-xs">{liveRes.room_type}</span></div>
                <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Arrival</span>
                  <span className="font-mono font-bold text-gray-700 text-xs">{fmtDate(liveRes.arrival)}</span></div>
                <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Departure</span>
                  <span className="font-mono font-bold text-gray-700 text-xs">{fmtDate(liveRes.departure)}</span></div>
                <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Nights</span>
                  <span className="font-mono font-black text-ids-header text-xs flex items-center space-x-1">
                    <Moon className="w-3 h-3" /><span>{liveRes.nights}</span></span></div>
                <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Adults</span>
                  <span className="font-bold text-gray-700 text-xs flex items-center space-x-1">
                    <Users className="w-3 h-3" /><span>{liveRes.adults}</span></span></div>
                <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Children</span>
                  <span className="font-bold text-gray-700 text-xs">{liveRes.children}</span></div>
                <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Pay Mode</span>
                  <span className="font-bold text-gray-700 text-xs">{liveRes.pay_mode}</span></div>
              </div>
            </div>

            {/* Occupied room panel */}
            <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="w-4 h-4 text-ids-header shrink-0" />
                <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider">Occupied Room</h3>
              </div>
              {!assignedRoomNo
                ? <p className="text-orange-600 font-bold text-[11px]">⚠ No room linked to this reservation in the current session.</p>
                : <div className="flex flex-wrap items-center gap-4 bg-gray-50 border border-ids-border rounded p-3">
                    <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Room</span>
                      <span className="font-mono font-black text-ids-header text-2xl">{assignedRoomNo}</span></div>
                    {assignedRoom && (<>
                      <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Type</span>
                        <span className="font-mono font-black text-gray-700">{assignedRoom.type_code}</span></div>
                      <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Floor</span>
                        <span className="font-bold text-gray-700">{assignedRoom.floor}</span></div>
                      <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Status</span>
                        <span className={`px-2 py-0.5 rounded border font-black text-[10px] uppercase ${roomSt?.color}`}>{roomSt?.label}</span></div>
                    </>)}
                  </div>
              }
            </div>

            {/* Folio box */}
            {folio && (
              <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs space-y-3">
                <div className="flex items-center space-x-2 border-b border-ids-border pb-2">
                  <DollarSign className="w-4 h-4 text-ids-header" />
                  <h3 className="font-black text-ids-sidebar text-[11px] uppercase tracking-wider">Folio Summary</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 border border-ids-border rounded p-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Total Charges</span>
                    <span className="font-mono font-black text-gray-700 text-sm">{fmtCurrency(folio.totalCharges)}</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <span className="text-[9px] text-green-600 font-bold uppercase block">Payments Received</span>
                    <span className="font-mono font-black text-green-700 text-sm">{fmtCurrency(folio.totalPayments)}</span>
                  </div>
                  <div className={`rounded p-2 border ${folio.balance > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                    <span className={`text-[9px] font-bold uppercase block ${folio.balance > 0 ? "text-red-600" : "text-green-600"}`}>Outstanding Balance</span>
                    <span className={`font-mono font-black text-sm ${folio.balance > 0 ? "text-red-700" : "text-green-700"}`}>{fmtCurrency(folio.balance)}</span>
                  </div>
                </div>

                {/* Payment history */}
                {(liveRes.payments || []).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Payment History</p>
                    {liveRes.payments.map((p, i) => (
                      <div key={i} className="flex justify-between text-[10px] font-mono font-bold bg-gray-50 border border-ids-border/40 rounded px-2 py-1">
                        <span className="text-gray-500">{p.date} · {p.method}</span>
                        <span className="text-green-700">{fmtCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Settle balance form (only when balance > 0 and checked_in) */}
                {!isNotCheckedIn && folio.balance > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-3">
                    <p className="text-amber-800 font-bold text-[11px] flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Outstanding balance must be settled before check-out.</span>
                    </p>
                    <form onSubmit={handlePostPayment} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Amount</label>
                        <input type="number" step="0.01" min="0.01" value={payAmount}
                          onChange={e => setPayAmount(e.target.value)} required
                          className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-ids-header" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Method</label>
                        <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                          className="w-full bg-white border border-ids-border rounded px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-ids-header">
                          <option value="Cash">Cash</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="UPI">UPI</option>
                        </select>
                      </div>
                      <button type="submit" disabled={payPosting}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer">
                        <CreditCard className="w-3.5 h-3.5" /><span>Post Payment</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Balance clear confirmation */}
                {!isNotCheckedIn && balanceClear && (
                  <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded p-2">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <p className="text-green-700 font-bold text-[11px]">Folio balance is clear. Ready to check out.</p>
                  </div>
                )}
              </div>
            )}

            {/* Confirm check-out step */}
            {!isNotCheckedIn && balanceClear && (
              <>
                {!confirmStep ? (
                  <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs">
                    <button onClick={() => setConfirmStep(true)}
                      className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[12px] rounded-lg tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-sm">
                      <LogOut className="w-5 h-5" /><span>Confirm Check-Out</span>
                    </button>
                    <p className="text-[10px] text-gray-400 font-semibold mt-2">
                      Review the summary above, then click to proceed.
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 shadow-3xs space-y-4">
                    <div className="flex items-center space-x-2 border-b border-amber-200 pb-2">
                      <LogOut className="w-5 h-5 text-amber-600" />
                      <h3 className="font-black text-amber-800 text-[11px] uppercase tracking-wider">Confirm Check-Out — Final Step</h3>
                    </div>
                    <div className="bg-white border border-amber-200 rounded p-3 space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold uppercase">Guest</span>
                        <span className="font-black text-ids-sidebar">{liveRes.guest_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold uppercase">Reservation No.</span>
                        <span className="font-mono font-black text-ids-header">{liveRes.reservation_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold uppercase">Room</span>
                        <span className="font-mono font-black text-amber-700 text-sm">{assignedRoomNo || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold uppercase">Stay</span>
                        <span className="font-bold text-gray-700">{fmtDate(liveRes.arrival)} → {fmtDate(liveRes.departure)} ({liveRes.nights}N)</span>
                      </div>
                      <div className="flex justify-between border-t border-amber-100 pt-2">
                        <span className="text-gray-500 font-bold uppercase">Final Balance</span>
                        <span className="font-mono font-black text-green-700">{fmtCurrency(folio.balance)} ✓</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={handleConfirmCheckOut} disabled={isProcessing}
                        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-black uppercase text-[11px] rounded-lg tracking-wider flex items-center space-x-2 cursor-pointer shadow-sm">
                        {isProcessing
                          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Processing...</span></>
                          : <><LogOut className="w-4 h-4" /><span>🚪 Check Out Now</span></>}
                      </button>
                      <button onClick={() => setConfirmStep(false)} disabled={isProcessing}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold uppercase text-[11px] rounded-lg border border-ids-border cursor-pointer">
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </PageWrapper>
  );
};

export default CheckOut;
