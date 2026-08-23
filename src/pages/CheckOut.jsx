import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReservations } from "../hooks/useReservations.js";
import { useHotelStore } from "../store/useHotelStore.js";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Badge from "../components/ui/Badge.jsx";
import { formatDateDisplay } from "../utils/dateUtils.js";
import { formatCurrency } from "../utils/formatters.js";
import { 
  LogOut, 
  Calendar, 
  Search, 
  CreditCard, 
  Receipt, 
  UserCheck, 
  CheckCircle, 
  DollarSign, 
  Filter, 
  X, 
  Check, 
  AlertCircle,
  Info,
  ChevronRight,
  ClipboardList,
  Printer
} from "lucide-react";
import EmptyState from "../components/ui/EmptyState.jsx";
import toast from "react-hot-toast";
import { RequirePermission } from "../components/auth/RequirePermission.jsx";
import { PERMISSIONS } from "../config/rbac.js";

export const CheckOut = () => {
  const navigate = useNavigate();
  const { reservations, checkOutGuest, postPayment } = useReservations();
  const today = useHotelStore((state) => state.selectedDate);

  // Tabs: departures | in_house | history
  const [activeTab, setActiveTab] = useState("departures");
  const [searchQuery, setSearchQuery] = useState("");
  const [outstandingOnly, setOutstandingOnly] = useState(false);

  // Modal States
  const [selectedResForPayment, setSelectedResForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentRemark, setPaymentRemark] = useState("Settle at Check-out");

  const [selectedResForReceipt, setSelectedResForReceipt] = useState(null);

  const paymentFormRef = useEnterAsTab({ onSubmit: (e) => handlePostPaymentSubmit(e) });

  // --- STATS CALCULATIONS ---
  // 1. Departures Scheduled Today (checked_in & departure date matches today)
  const departuresToday = reservations.filter(
    (res) => res.departure === today && res.status === "checked_in"
  );

  // 2. Total In-House (currently checked_in)
  const totalInHouse = reservations.filter(
    (res) => res.status === "checked_in"
  );

  // 3. Checked Out Today
  const checkedOutCount = reservations.filter(
    (res) => res.status === "checked_out"
  ).length;

  // 4. Pending Settle (checked_in with outstanding balance > 0)
  const pendingSettleCount = totalInHouse.filter((res) => {
    const totalPayments = (res.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
    const balance = res.total_amount - totalPayments;
    return balance > 0;
  }).length;

  // --- FILTERED DATA LIST ---
  const getBaseList = () => {
    switch (activeTab) {
      case "departures":
        return departuresToday;
      case "in_house":
        return totalInHouse;
      case "history":
        return reservations.filter((res) => res.status === "checked_out");
      default:
        return departuresToday;
    }
  };

  const filteredList = getBaseList().filter((res) => {
    // Search query matches guest name, reservation number, or assigned room
    const matchesSearch = 
      res.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.reservation_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.rooms_assigned || []).some(room => room.includes(searchQuery));

    // Outstanding balance filter
    const totalPayments = (res.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
    const balance = res.total_amount - totalPayments;
    const matchesOutstanding = !outstandingOnly || balance > 0;

    return matchesSearch && matchesOutstanding;
  });

  // --- ACTION HANDLERS ---
  const handleQuickCheckOut = (resItem) => {
    const totalPayments = (resItem.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
    const balance = resItem.total_amount - totalPayments;

    if (balance > 0) {
      toast.error(`Folio ${resItem.reservation_no} balance is outstanding. Settle ${formatCurrency(balance)} first!`);
      handleOpenPaymentModal(resItem);
      return;
    }

    checkOutGuest(resItem.reservation_no);
    toast.success(`Checked out ${resItem.guest_name}! Room marked as Vacant Dirty.`);
  };

  const handleExpressCheckOut = () => {
    const clearDepartures = departuresToday.filter(res => {
      const totalPayments = (res.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
      const balance = res.total_amount - totalPayments;
      return balance <= 0;
    });

    if (clearDepartures.length === 0) {
      toast.error("No scheduled departures today have a settled (0) balance.");
      return;
    }

    clearDepartures.forEach(res => {
      checkOutGuest(res.reservation_no);
    });

    toast.success(`Express Check-Out successful! Checked out ${clearDepartures.length} guests.`);
  };

  // --- MODAL UTILITIES ---
  const handleOpenPaymentModal = (resItem) => {
    const totalPayments = (resItem.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
    const balance = resItem.total_amount - totalPayments;
    setSelectedResForPayment(resItem);
    setPaymentAmount(balance > 0 ? balance.toString() : "0");
    setPaymentMethod(resItem.pay_mode && resItem.pay_mode !== "Bill to Company" ? resItem.pay_mode : "Cash");
    setPaymentRemark("Settle at Check-out");
  };

  const handlePostPaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedResForPayment) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid positive payment amount.");
      return;
    }

    postPayment(selectedResForPayment.reservation_no, amountNum, paymentMethod);
    toast.success(`Payment of ${formatCurrency(amountNum)} posted via ${paymentMethod}!`);
    
    // Auto refill/close state checks
    const updatedRes = reservations.find(r => r.reservation_no === selectedResForPayment.reservation_no);
    if (updatedRes) {
      const newTotalPayments = (updatedRes.payments || []).reduce((acc, curr) => acc + curr.amount, 0) + amountNum;
      const newBalance = updatedRes.total_amount - newTotalPayments;
      if (newBalance <= 0) {
        setPaymentAmount("0");
      } else {
        setPaymentAmount(newBalance.toString());
      }
    } else {
      setSelectedResForPayment(null);
    }
  };

  const handleCompleteCheckOutFromModal = (resNo, guestName) => {
    checkOutGuest(resNo);
    toast.success(`Checked out ${guestName}! Room marked as Vacant Dirty.`);
    setSelectedResForPayment(null);
  };

  // Live data reference inside payment modal
  const liveRes = selectedResForPayment 
    ? reservations.find(r => r.reservation_no === selectedResForPayment.reservation_no)
    : null;
  const liveTotalPayments = liveRes ? (liveRes.payments || []).reduce((acc, curr) => acc + curr.amount, 0) : 0;
  const liveBalance = liveRes ? liveRes.total_amount - liveTotalPayments : 0;

  return (
    <PageWrapper
      title="Front Desk Expected Departures"
      subtitle="Examine guest stay ledger, process final payment settlements, and check out departing residents"
    >
      {/* 1. OPERATIONAL KPIS CARDS */}
      <div id="checkout-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none font-sans">
        
        {/* KPI 1: Departures Today */}
        <div 
          onClick={() => setActiveTab("departures")}
          className={`cursor-pointer bg-white border rounded-lg p-4 shadow-3xs flex items-center justify-between transition-all hover:scale-[1.01] ${activeTab === "departures" ? "border-amber-500 ring-1 ring-amber-300" : "border-ids-border/60 hover:border-amber-300"}`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Departures Today</span>
            <div className="text-xl font-bold font-mono text-amber-700">{departuresToday.length}</div>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Total In-House */}
        <div 
          onClick={() => setActiveTab("in_house")}
          className={`cursor-pointer bg-white border rounded-lg p-4 shadow-3xs flex items-center justify-between transition-all hover:scale-[1.01] ${activeTab === "in_house" ? "border-blue-500 ring-1 ring-blue-300" : "border-ids-border/60 hover:border-blue-300"}`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total In-House</span>
            <div className="text-xl font-bold font-mono text-blue-700">{totalInHouse.length}</div>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Checked Out History */}
        <div 
          onClick={() => setActiveTab("history")}
          className={`cursor-pointer bg-white border rounded-lg p-4 shadow-3xs flex items-center justify-between transition-all hover:scale-[1.01] ${activeTab === "history" ? "border-slate-500 ring-1 ring-slate-300" : "border-ids-border/60 hover:border-slate-300"}`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Checked Out History</span>
            <div className="text-xl font-bold font-mono text-slate-700">{checkedOutCount}</div>
          </div>
          <div className="p-2 bg-slate-50 text-slate-600 rounded">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Pending Folio Settle */}
        <div 
          onClick={() => {
            setActiveTab("in_house");
            setOutstandingOnly(true);
          }}
          className="cursor-pointer bg-white border border-ids-border/60 rounded-lg p-4 shadow-3xs flex items-center justify-between transition-all hover:scale-[1.01] hover:border-red-300"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pending Settle</span>
            <div className="text-xl font-bold font-mono text-red-600">{pendingSettleCount}</div>
          </div>
          <div className="p-2 bg-red-50 text-red-600 rounded">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 2. TABS SELECTOR */}
      <div id="checkout-tabs" className="flex border-b border-ids-border mb-4 select-none">
        <button
          onClick={() => {
            setActiveTab("departures");
            setOutstandingOnly(false);
          }}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
            activeTab === "departures" 
              ? "border-ids-sidebar text-ids-sidebar" 
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Departures Today ({departuresToday.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("in_house");
            setOutstandingOnly(false);
          }}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
            activeTab === "in_house" 
              ? "border-ids-sidebar text-ids-sidebar" 
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          In-House Guests ({totalInHouse.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setOutstandingOnly(false);
          }}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
            activeTab === "history" 
              ? "border-ids-sidebar text-ids-sidebar" 
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Check-Out History ({checkedOutCount})
        </button>
      </div>

      {/* 3. FILTERS AND EXPRESS ACTION CONTROLS */}
      <div id="check-out-controls" className="bg-white border border-ids-border p-4 rounded-lg shadow-3xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            id="departures-search"
            type="text"
            placeholder="Search by guest, room, or reservation #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-xs text-gray-800"
          />
        </div>

        {/* Checkbox and Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Outstanding Balance Toggle */}
          <button
            onClick={() => setOutstandingOnly(!outstandingOnly)}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              outstandingOnly 
                ? "bg-red-50 text-red-700 border-red-300" 
                : "bg-gray-50 text-gray-600 border-ids-border hover:bg-gray-100"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Outstanding Balance Only</span>
          </button>

          {/* Express Check-Out (Only for Departures Tab) */}
          {activeTab === "departures" && (
            <button
              onClick={handleExpressCheckOut}
              className="px-3.5 py-1.5 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white rounded font-bold text-xs shadow-2xs flex items-center space-x-1.5 transition-all"
              title="Checkout all departing guests who have a zero balance"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Express Check-Out (All Clear)</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. DEPARTURES & IN-HOUSE GUEST LIST TABLE */}
      <div id="departures-table-wrapper" className="bg-white border border-ids-border rounded-lg overflow-hidden shadow-xs overflow-x-auto select-none">
        <table className="w-full text-left border-collapse text-xs min-w-[800px]">
          <thead className="bg-ids-sidebar text-white font-bold border-b border-ids-border text-[10px] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-bold">Res No.</th>
              <th className="px-4 py-3 font-bold">Room</th>
              <th className="px-4 py-3 font-bold">Guest Name</th>
              <th className="px-4 py-3 font-bold">Arrival</th>
              <th className="px-4 py-3 font-bold">Departure</th>
              <th className="px-4 py-3 font-bold text-right">Total Bill</th>
              <th className="px-4 py-3 font-bold text-right">Paid</th>
              <th className="px-4 py-3 font-bold text-right">Balance</th>
              <th className="px-4 py-3 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ids-border/40">
            {filteredList.length > 0 ? (
              filteredList.map((res) => {
                const totalPayments = (res.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
                const balance = res.total_amount - totalPayments;
                
                return (
                  <tr
                    key={res.reservation_no}
                    id={`departure-row-${res.reservation_no}`}
                    onClick={() => navigate(`/app/reservations/${res.reservation_no}`)}
                    className="hover:bg-ids-bg/40 cursor-pointer transition-colors"
                  >
                    {/* Reservation Number */}
                    <td className="px-4 py-3.5 font-mono font-bold text-ids-header">
                      {res.reservation_no}
                    </td>

                    {/* Room */}
                    <td className="px-4 py-3.5 font-mono font-bold text-orange-600">
                      {res.rooms_assigned && res.rooms_assigned.length > 0 ? (
                        <span className="bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-orange-700">
                          {res.rooms_assigned.join(", ")}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal italic">Unassigned</span>
                      )}
                    </td>

                    {/* Guest Name & Company Code */}
                    <td className="px-4 py-3.5 font-bold text-gray-700">
                      <div>{res.guest_name}</div>
                      {res.company_code && (
                        <div className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">
                          💼 Co: {res.company_code}
                        </div>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3.5 text-gray-500 font-mono">
                      {res.arrival}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 font-mono">
                      {res.departure}
                    </td>

                    {/* Financials */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-600">
                      {formatCurrency(res.total_amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-green-600">
                      {formatCurrency(totalPayments)}
                    </td>
                    <td className={`px-4 py-3.5 text-right font-mono font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(balance)}
                    </td>

                    {/* Actions Column */}
                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1.5">
                        
                        {res.status === "checked_in" ? (
                          <>
                            {/* Outstanding balance implies settlement required first */}
                            {balance > 0 ? (
                              <button
                                id={`btn-settle-${res.reservation_no}`}
                                onClick={() => handleOpenPaymentModal(res)}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-[10px] rounded flex items-center space-x-1 transition-all"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Settle & Pay</span>
                              </button>
                            ) : (
                              <RequirePermission permission={PERMISSIONS.CHECKOUT_PERFORM}>
                                <button
                                  id={`btn-checkout-${res.reservation_no}`}
                                  onClick={() => handleQuickCheckOut(res)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded flex items-center space-x-1 shadow-2xs transition-all"
                                >
                                  <LogOut className="w-3 h-3" />
                                  <span>Check-Out</span>
                                </button>
                              </RequirePermission>
                            )}
                          </>
                        ) : (
                          /* Checked out guests can look up invoices */
                          <button
                            id={`btn-invoice-${res.reservation_no}`}
                            onClick={() => setSelectedResForReceipt(res)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[10px] rounded flex items-center space-x-1 transition-all"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>View Invoice</span>
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/app/reservations/${res.reservation_no}`)}
                          className="p-1 text-gray-400 hover:text-ids-sidebar transition-all"
                          title="View Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="p-8">
                  <EmptyState
                    title={
                      activeTab === "departures" 
                        ? "No expected departures today" 
                        : activeTab === "in_house" 
                        ? "No active in-house guests found" 
                        : "No checked-out history"
                    }
                    description="Adjust your search criteria, clear outstanding balance toggles, or browse other PMS operational tabs."
                    icon={ClipboardList}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL 1: FOLIO SETTLEMENT & PAYMENT POSTING --- */}
      {selectedResForPayment && liveRes && (
        <div id="payment-posting-modal" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white border border-ids-border rounded-lg shadow-xl max-w-md w-full overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="bg-ids-sidebar text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4.5 h-4.5" />
                <span className="font-bold text-xs uppercase tracking-wider">Folio Settle & Posting</span>
              </div>
              <button 
                onClick={() => setSelectedResForPayment(null)}
                className="text-white/80 hover:text-white transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Contents */}
            <div className="p-4 space-y-4">
              
              {/* Guest Folio Overview */}
              <div className="bg-gray-50 border border-ids-border/40 rounded p-3 text-[11px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Reservation #</span>
                  <span className="font-mono font-bold text-ids-header">{liveRes.reservation_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Guest Name</span>
                  <span className="font-bold text-gray-700">{liveRes.guest_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Room Assigned</span>
                  <span className="font-mono font-bold text-orange-600">Room {liveRes.rooms_assigned.join(", ") || "None"}</span>
                </div>
                <hr className="border-ids-border/30 my-1" />
                <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                  <div>
                    <div className="text-[9px] font-black uppercase text-gray-400">Total Charges</div>
                    <div className="text-xs font-bold text-gray-600">{formatCurrency(liveRes.total_amount)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase text-gray-400">Total Payments</div>
                    <div className="text-xs font-bold text-green-600">{formatCurrency(liveTotalPayments)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase text-gray-400">Balance Due</div>
                    <div className={`text-xs font-bold ${liveBalance > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(liveBalance)}</div>
                  </div>
                </div>
              </div>

              {/* Settle Action / Posting Form */}
              {liveBalance > 0 ? (
                <form ref={paymentFormRef} id="post-payment-checkout-form" onSubmit={handlePostPaymentSubmit} className="space-y-3">
                  <div className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>Post payment transactions to clear the remaining balance</span>
                  </div>

                  {/* Payment Amount */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1">Payment Amount *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-mono font-bold text-xs">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-6 pr-3 py-1.5 border border-ids-border rounded font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header"
                        required
                        max={liveBalance}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 italic mt-0.5 block">Cannot exceed the outstanding balance due.</span>
                  </div>

                  {/* Method & Remark */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1">Payment Method *</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2 py-1.5 border border-ids-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header font-bold bg-white"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="UPI / QR">UPI / QR Payment</option>
                        <option value="Online / Link">Online Gateway</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1">Remarks</label>
                      <input
                        type="text"
                        value={paymentRemark}
                        onChange={(e) => setPaymentRemark(e.target.value)}
                        className="w-full px-2 py-1.5 border border-ids-border rounded text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded transition-all shadow-2xs mt-4 flex items-center justify-center space-x-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Post Payment & Settle</span>
                  </button>
                </form>
              ) : (
                /* Clear Balance Action Screen */
                <div className="space-y-4 animate-scale-in text-center py-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-2xs">
                    <Check className="w-6 h-6 stroke-[3px]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Folio Balance is Clear!</h4>
                    <p className="text-xs text-gray-500 mt-1">This guest has no outstanding balance. You can proceed with standard check-out operations.</p>
                  </div>

                  <button
                    onClick={() => handleCompleteCheckOutFromModal(liveRes.reservation_no, liveRes.guest_name)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded shadow-2xs transition-all flex items-center justify-center space-x-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Complete Check-Out Now</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: GUEST INVOICE RECEIPT VIEWER --- */}
      {selectedResForReceipt && (
        <div id="invoice-receipt-modal" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white border border-ids-border rounded-lg shadow-xl max-w-lg w-full overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4.5 h-4.5 text-slate-300" />
                <span className="font-bold text-xs uppercase tracking-wider">Folio Bill / Invoice #{selectedResForReceipt.reservation_no}</span>
              </div>
              <button 
                onClick={() => setSelectedResForReceipt(null)}
                className="text-white/80 hover:text-white transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Receipt Printable Layout */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto" id="printable-folio-area">
              
              {/* Hotel Header */}
              <div className="text-center border-b border-dashed border-gray-300 pb-4">
                <h2 className="text-sm font-black uppercase text-gray-800 tracking-wider">FORTUNE NEXT TRAINING HOTEL</h2>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">AMOB University Campus • Gondar Road • IDS PMS Trainer</p>
                <div className="inline-block mt-3 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded text-[9px] font-black uppercase">
                  Final Settled Folio Invoice
                </div>
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div className="space-y-1">
                  <div><span className="text-gray-400 uppercase tracking-wider font-bold">Guest Name:</span> <span className="font-bold text-gray-800">{selectedResForReceipt.guest_name}</span></div>
                  <div><span className="text-gray-400 uppercase tracking-wider font-bold">Room Assigned:</span> <span className="font-mono font-bold text-orange-600">Room {selectedResForReceipt.rooms_assigned.join(", ") || "N/A"}</span></div>
                  {selectedResForReceipt.company_code && (
                    <div><span className="text-gray-400 uppercase tracking-wider font-bold">Company Co:</span> <span className="font-mono font-bold text-gray-600">{selectedResForReceipt.company_code}</span></div>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <div><span className="text-gray-400 uppercase tracking-wider font-bold">Arrival:</span> <span className="font-mono text-gray-700">{selectedResForReceipt.arrival}</span></div>
                  <div><span className="text-gray-400 uppercase tracking-wider font-bold">Departure:</span> <span className="font-mono text-gray-700">{selectedResForReceipt.departure}</span></div>
                  <div><span className="text-gray-400 uppercase tracking-wider font-bold">Nights Stay:</span> <span className="font-mono text-gray-700">{selectedResForReceipt.nights} Night(s)</span></div>
                </div>
              </div>

              {/* Charges Section */}
              <div className="space-y-2 select-none">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-200 pb-1">Stay Charge Ledger</div>
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="text-gray-400 uppercase text-[9px]">
                      <th className="text-left font-bold py-1">Description</th>
                      <th className="text-right font-bold py-1">Rate</th>
                      <th className="text-right font-bold py-1">Qty (Nights)</th>
                      <th className="text-right font-bold py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 text-gray-700">
                      <td className="py-2 text-left font-sans">Room Charges - Type: {selectedResForReceipt.room_type}</td>
                      <td className="py-2 text-right">{formatCurrency(selectedResForReceipt.rate)}</td>
                      <td className="py-2 text-right">{selectedResForReceipt.nights}</td>
                      <td className="py-2 text-right font-bold">{formatCurrency(selectedResForReceipt.total_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payments Ledger Section */}
              <div className="space-y-2 select-none">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-200 pb-1">Payments & Credits Posted</div>
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="text-gray-400 uppercase text-[9px]">
                      <th className="text-left font-bold py-1">Posting Date</th>
                      <th className="text-left font-bold py-1">Method</th>
                      <th className="text-left font-bold py-1">Remarks</th>
                      <th className="text-right font-bold py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedResForReceipt.payments && selectedResForReceipt.payments.length > 0 ? (
                      selectedResForReceipt.payments.map((p, idx) => (
                        <tr key={idx} className="border-b border-gray-100 text-gray-600">
                          <td className="py-2 text-left">{p.date || today}</td>
                          <td className="py-2 text-left font-sans font-bold text-green-600">{p.method}</td>
                          <td className="py-2 text-left text-gray-400 font-sans italic">{p.remark || "Folio settlement"}</td>
                          <td className="py-2 text-right font-bold text-green-600">-{formatCurrency(p.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      /* If payments field was empty but guest checked out, show synthetic auto-settlement for visualization consistency */
                      <tr className="border-b border-gray-100 text-gray-600">
                        <td className="py-2 text-left">{selectedResForReceipt.departure}</td>
                        <td className="py-2 text-left font-sans font-bold text-green-600">{selectedResForReceipt.pay_mode || "Settled Cash"}</td>
                        <td className="py-2 text-left text-gray-400 font-sans italic">Express Checkout Folio Settle</td>
                        <td className="py-2 text-right font-bold text-green-600">-{formatCurrency(selectedResForReceipt.total_amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Balance Summary */}
              <div className="border-t border-dashed border-gray-300 pt-4 flex justify-between items-center font-mono">
                <span className="text-xs uppercase font-black tracking-wider text-gray-800">Folio Balance Due:</span>
                <span className="text-sm font-black text-green-600">$0.00</span>
              </div>

              {/* Signatures Area */}
              <div className="grid grid-cols-2 gap-8 text-[10px] text-gray-400 pt-8 border-t border-gray-100 font-sans">
                <div className="text-center">
                  <div className="border-b border-gray-300 h-10 w-2/3 mx-auto"></div>
                  <div className="mt-1 font-bold">Guest Signature</div>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-300 h-10 w-2/3 mx-auto"></div>
                  <div className="mt-1 font-bold">Cashier / Front Desk Agent</div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 border-t border-ids-border/60 px-4 py-3 flex items-center justify-between">
              <div className="text-[10px] text-gray-400 font-mono italic">
                PMS Invoicing Module
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    toast.success("Sending invoice to hotel printer queue...");
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded shadow-2xs flex items-center space-x-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Folio Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedResForReceipt(null)}
                  className="px-3.5 py-1.5 border border-ids-border rounded font-bold text-xs text-gray-600 hover:bg-gray-100 transition-all bg-white"
                >
                  Close View
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </PageWrapper>
  );
};

export default CheckOut;
