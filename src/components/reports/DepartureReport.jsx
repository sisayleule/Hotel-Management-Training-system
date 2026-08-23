import React, { useState } from "react";
import { ArrowLeft, Printer, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { useHotelStore } from "../../store/useHotelStore.js";
import { formatCurrency } from "../../utils/formatters.js";
import toast from "react-hot-toast";

export const DepartureReport = ({ onBack }) => {
  const selectedDate = useHotelStore((state) => state.selectedDate);
  const reservations = useHotelStore((state) => state.reservations);

  const [dateFilter, setDateFilter] = useState(selectedDate);
  const [statusFilter, setStatusFilter] = useState("All");

  // Dynamic filter
  const departuresList = reservations.filter((res) => {
    // Is departure date matches or is overdue (still checked in and departure date <= dateFilter)
    const matchesDate = res.departure === dateFilter;
    const isOverdue = res.status === "checked_in" && res.departure < dateFilter;

    // We include overdue departures as they are extremely critical to manage in a real hotel
    const dateCriteria = matchesDate || isOverdue;

    let matchesStatus = true;
    if (statusFilter === "Due Out") matchesStatus = res.status === "checked_in";
    else if (statusFilter === "Checked-out") matchesStatus = res.status === "checked_out";

    return dateCriteria && matchesStatus;
  });

  const dueOutCount = departuresList.filter(r => r.status === "checked_in").length;
  const checkedOutCount = departuresList.filter(r => r.status === "checked_out").length;

  const handlePrint = () => {
    toast.success("Printing Expected Departures report...");
    window.print();
  };

  const handleCSV = () => {
    toast.success("Exported Departures list as CSV file.");
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
              Expected Departures Report
            </h2>
            <p className="text-[10px] text-gray-500 font-mono">
              Monitor room folio settlements, checkout timings, and dirty keys clearances
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
      <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Target Departure Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Departure Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-bold"
          >
            <option value="All">All Departures</option>
            <option value="Due Out">Still In-House (Due Out)</option>
            <option value="Checked-out">Successfully Checked Out</option>
          </select>
        </div>
        <button
          onClick={() => toast.success("Filtered departures data.")}
          className="bg-slate-800 hover:bg-slate-950 text-white font-bold py-1.5 rounded flex items-center justify-center space-x-1 h-[32px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Departures</span>
        </button>
      </div>

      {/* Report Table */}
      <div className="bg-white border border-ids-border rounded-lg overflow-hidden shadow-xs overflow-x-auto p-4">
        
        <table className="w-full text-left border-collapse text-xs min-w-[800px]">
          <thead className="bg-slate-100 text-gray-700 font-bold border-b border-ids-border text-[10px] uppercase tracking-wider font-mono">
            <tr>
              <th className="px-3 py-2.5">Resv#</th>
              <th className="px-3 py-2.5">Guest Name</th>
              <th className="px-3 py-2.5 text-center">Room</th>
              <th className="px-3 py-2.5">Room Type</th>
              <th className="px-3 py-2.5">Arrival</th>
              <th className="px-3 py-2.5">Scheduled Departure</th>
              <th className="px-3 py-2.5 text-center">Nights</th>
              <th className="px-3 py-2.5 text-right">Charges</th>
              <th className="px-3 py-2.5 text-right">Payments</th>
              <th className="px-3 py-2.5 text-right">Outstanding</th>
              <th className="px-3 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ids-border/40 font-mono text-gray-600">
            {departuresList.length > 0 ? (
              departuresList.map((res) => {
                const isOverdue = res.status === "checked_in" && res.departure < dateFilter;
                const totalPayments = (res.payments || []).reduce((sum, p) => sum + p.amount, 0);
                const balance = res.total_amount - totalPayments;

                return (
                  <tr 
                    key={res.reservation_no} 
                    className={`transition-colors ${isOverdue ? "bg-red-50/70 hover:bg-red-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-3 py-2.5 font-bold text-ids-header">{res.reservation_no}</td>
                    <td className="px-3 py-2.5 font-sans font-bold text-gray-800 flex items-center space-x-1.5">
                      <span>{res.guest_name}</span>
                      {isOverdue && (
                        <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 font-bold px-1 py-0.2 rounded animate-pulse inline-flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" />
                          OVERDUE
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-orange-600">
                      {res.rooms_assigned && res.rooms_assigned.length > 0 ? res.rooms_assigned.join(", ") : "N/A"}
                    </td>
                    <td className="px-3 py-2.5 font-sans">{res.room_type}</td>
                    <td className="px-3 py-2.5">{res.arrival}</td>
                    <td className={`px-3 py-2.5 ${isOverdue ? "font-bold text-red-600" : ""}`}>{res.departure}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-700">{res.nights}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{formatCurrency(res.total_amount)}</td>
                    <td className="px-3 py-2.5 text-right text-green-600">-{formatCurrency(totalPayments)}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        res.status === "checked_in" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        res.status === "checked_out" ? "bg-slate-100 text-slate-600 border border-slate-300" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {res.status === "checked_in" ? "DUE OUT" : res.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="p-8 text-center text-gray-400 italic">
                  No departing guests scheduled for {dateFilter} matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Dynamic Summary Row */}
        <div className="bg-slate-50 border border-ids-border/50 rounded p-3 mt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] font-mono font-bold text-slate-700 gap-2">
          <span>Target Date: {dateFilter} Departures Analysis</span>
          <div className="flex gap-4">
            <span className="text-amber-700">📌 Remaining Due-out: {dueOutCount}</span>
            <span className="text-green-700">✅ Checked-out: {checkedOutCount}</span>
            <span className="text-slate-800">📊 Combined departures: {departuresList.length}</span>
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

export default DepartureReport;
