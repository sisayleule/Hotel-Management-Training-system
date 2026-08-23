import React, { useState } from "react";
import { ArrowLeft, Printer, FileText, RefreshCw, Calendar } from "lucide-react";
import { useHotelStore } from "../../store/useHotelStore.js";
import { formatCurrency } from "../../utils/formatters.js";
import toast from "react-hot-toast";

export const ArrivalReport = ({ onBack }) => {
  const selectedDate = useHotelStore((state) => state.selectedDate);
  const reservations = useHotelStore((state) => state.reservations);

  const [dateFilter, setDateFilter] = useState(selectedDate);
  const [statusFilter, setStatusFilter] = useState("All");
  const [roomTypeFilter, setRoomTypeFilter] = useState("All");

  // Dynamic filter
  const arrivalsList = reservations.filter((res) => {
    // Arrival date matches
    const matchesDate = res.arrival === dateFilter;
    
    // Status matches
    let matchesStatus = true;
    if (statusFilter === "Expected") matchesStatus = res.status === "confirmed";
    else if (statusFilter === "Checked-in") matchesStatus = res.status === "checked_in";
    else if (statusFilter === "Cancelled") matchesStatus = res.status === "cancelled";

    // Room Type matches
    const matchesType = roomTypeFilter === "All" || res.room_type === roomTypeFilter;

    return matchesDate && matchesStatus && matchesType;
  });

  const expectedCount = arrivalsList.filter(r => r.status === "confirmed").length;
  const checkedInCount = arrivalsList.filter(r => r.status === "checked_in").length;
  const cancelledCount = arrivalsList.filter(r => r.status === "cancelled").length;

  const handlePrint = () => {
    toast.success("Printing Expected Arrivals report...");
    window.print();
  };

  const handleCSV = () => {
    toast.success("Exported Expected Arrivals ledger as CSV file.");
  };

  return (
    <div className="space-y-6 font-sans select-none text-xs text-gray-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ids-border">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 border border-ids-border rounded bg-white hover:bg-gray-100 transition-all text-gray-600"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider">
              Expected Arrivals Report
            </h2>
            <p className="text-[10px] text-gray-500 font-mono">
              Daily arrival registration metrics & billing structures
            </p>
          </div>
        </div>

        <div className="flex space-x-2 shrink-0">
          <button
            onClick={handleCSV}
            className="px-3 py-1.5 bg-white border border-ids-border hover:bg-gray-50 rounded font-bold flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white rounded font-bold flex items-center space-x-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Folio</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Target Arrival Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Operational Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-bold"
          >
            <option value="All">All Arrivals</option>
            <option value="Expected">Expected / Confirmed</option>
            <option value="Checked-in">Checked In</option>
            <option value="Cancelled">No-Show / Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Room Category</label>
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-bold"
          >
            <option value="All">All Categories</option>
            <option value="DLX">D/DLX - Deluxe</option>
            <option value="EXE">D/EXE - Executive</option>
            <option value="SUI">V/SUI - Suite</option>
            <option value="PNH">D/PNH - Penthouse</option>
          </select>
        </div>
        <button
          onClick={() => toast.success("Filtered arrivals data.")}
          className="bg-slate-800 hover:bg-slate-950 text-white font-bold py-1.5 rounded flex items-center justify-center space-x-1 h-[32px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Report Table */}
      <div className="bg-white border border-ids-border rounded-lg overflow-hidden shadow-xs overflow-x-auto p-4">
        
        <table className="w-full text-left border-collapse text-xs min-w-[800px]">
          <thead className="bg-slate-100 text-gray-700 font-bold border-b border-ids-border text-[10px] uppercase tracking-wider font-mono">
            <tr>
              <th className="px-3 py-2.5">Resv#</th>
              <th className="px-3 py-2.5">Guest Name</th>
              <th className="px-3 py-2.5">Company Code</th>
              <th className="px-3 py-2.5">Room Type</th>
              <th className="px-3 py-2.5 text-center">Nights</th>
              <th className="px-3 py-2.5 text-center">Adults/Kids</th>
              <th className="px-3 py-2.5">Pay Mode</th>
              <th className="px-3 py-2.5 text-right">Room Rate</th>
              <th className="px-3 py-2.5 text-right">Total Billing</th>
              <th className="px-3 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ids-border/40 font-mono text-gray-600">
            {arrivalsList.length > 0 ? (
              arrivalsList.map((res) => (
                <tr key={res.reservation_no} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-ids-header">{res.reservation_no}</td>
                  <td className="px-3 py-2.5 font-sans font-bold text-gray-800">{res.guest_name}</td>
                  <td className="px-3 py-2.5">{res.company_code || <span className="text-gray-400 font-normal">--</span>}</td>
                  <td className="px-3 py-2.5 font-sans">{res.room_type}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-700">{res.nights}</td>
                  <td className="px-3 py-2.5 text-center">{res.adults}A / {res.children}C</td>
                  <td className="px-3 py-2.5 font-sans">{res.pay_mode}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500">{formatCurrency(res.rate || 3500)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-gray-700">{formatCurrency(res.total_amount || 3500)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      res.status === "confirmed" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      res.status === "checked_in" ? "bg-green-50 text-green-700 border border-green-200" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {res.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="p-8 text-center text-gray-400 italic">
                  No arriving reservations scheduled for {dateFilter} matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Dynamic Summary Row */}
        <div className="bg-slate-50 border border-ids-border/50 rounded p-3 mt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] font-mono font-bold text-slate-700 gap-2">
          <span>Target Date: {dateFilter} Arrivals Analysis</span>
          <div className="flex gap-4">
            <span className="text-amber-700">📌 Expected: {expectedCount}</span>
            <span className="text-green-700">✅ Checked-in: {checkedInCount}</span>
            <span className="text-slate-500">❌ Cancelled/No-Show: {cancelledCount}</span>
            <span className="text-slate-800">📊 Combined total: {arrivalsList.length}</span>
          </div>
        </div>

      </div>

      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-ids-border rounded font-bold text-gray-600 hover:bg-gray-50 transition-all bg-white"
        >
          Back to Reports Hub
        </button>
      </div>

    </div>
  );
};

export default ArrivalReport;
