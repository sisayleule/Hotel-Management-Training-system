import React, { useState } from "react";
import { ArrowLeft, Printer, FileText, Mail, ChevronDown, RefreshCw, Layers } from "lucide-react";
import { formatCurrency } from "../../utils/formatters.js";
import toast from "react-hot-toast";

export const GuestBlockReport = ({ onBack }) => {
  const [dateFrom, setDateFrom] = useState("2026-06-14");
  const [dateTo, setDateTo] = useState("2026-06-30");
  const [roomType, setRoomType] = useState("All");
  const [status, setStatus] = useState("All");

  // Mock guest block data modeled closely on the IDS Next GSTBLK screenshot
  const blockData = [
    { room: "303", arrival: "14-JAN-2022 19:43", departure: "18-JAN-2022 12:00", desc: "Corporate Guest Hold", dep: "FO", reason: "MANA", user: "SYSTEM" },
    { room: "516", arrival: "14-JAN-2022 19:56", departure: "16-JAN-2022 12:00", desc: "Maintenance Holding Block", dep: "HK", reason: "MANA", user: "IT_ADMIN" },
    { room: "408", arrival: "15-JAN-2022 08:30", departure: "19-JAN-2022 12:00", desc: "VIP Arrival Suite Prep", dep: "FO", reason: "DIR", user: "RECEPT" },
    { room: "212", arrival: "16-JAN-2022 10:15", departure: "20-JAN-2022 12:00", desc: "Painting Block Wing 2", dep: "HK", reason: "MAINT", user: "SYSTEM" }
  ];

  const handlePrint = () => {
    toast.success("Preparing printer spooler for Detailed Position - GSTBLK...");
    window.print();
  };

  const handleExportCSV = () => {
    toast.success("Detailed Position GSTBLK report exported to downloads as CSV");
  };

  return (
    <div className="space-y-6 font-sans select-none text-xs text-gray-800">
      
      {/* Report Header */}
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
              Detailed Position — GSTBLK
            </h2>
            <p className="text-[10px] text-gray-500 font-mono">
              Report code: PMS.FO.GSTBLK • Audit ledger coordinates
            </p>
          </div>
        </div>

        {/* Action button triggers */}
        <div className="flex space-x-2 shrink-0">
          <button
            onClick={handleExportCSV}
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
      <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Room Type</label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-bold"
          >
            <option value="All">All Types</option>
            <option value="DLX">D/DLX - Deluxe</option>
            <option value="EXE">D/EXE - Executive</option>
            <option value="SUI">V/SUI - Suite</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Holding Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-bold"
          >
            <option value="All">All Holds</option>
            <option value="MANA">Manager Block</option>
            <option value="MAINT">Maintenance Out</option>
          </select>
        </div>
        <button
          onClick={() => toast.success("Refreshed Detailed Position values.")}
          className="bg-slate-800 hover:bg-slate-950 text-white font-bold py-1.5 rounded flex items-center justify-center space-x-1 h-[32px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Generate</span>
        </button>
      </div>

      {/* Printable Report Layout */}
      <div className="bg-white border border-ids-border rounded-lg overflow-hidden shadow-xs overflow-x-auto p-6" id="printable-area">
        
        {/* Corporate Heading for Printing */}
        <div className="text-center border-b border-slate-300 pb-4 mb-4 hidden print:block">
          <h2 className="text-sm font-black uppercase text-gray-900 tracking-wider">FORTUNE NEXT TRAINING HOTEL</h2>
          <p className="text-[10px] text-gray-500 font-mono font-bold">Detailed Position Guest Block Report — GSTBLK</p>
          <p className="text-[9px] text-gray-400 font-mono">Date Range: {dateFrom} to {dateTo}</p>
        </div>

        {/* GSTBLK Ledger Table */}
        <table className="w-full text-left border-collapse text-xs min-w-[700px]">
          <thead className="bg-slate-800 text-white font-bold border-b border-ids-border text-[10px] uppercase tracking-wider font-mono">
            <tr>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Blocked From</th>
              <th className="px-4 py-3">Blocked To</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Dep</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ids-border font-mono text-gray-700">
            {blockData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-bold text-orange-600">{item.room}</td>
                <td className="px-4 py-3 text-slate-600">{item.arrival}</td>
                <td className="px-4 py-3 text-slate-600">{item.departure}</td>
                <td className="px-4 py-3 font-sans font-medium text-slate-800">{item.desc}</td>
                <td className="px-4 py-3 font-bold">{item.dep}</td>
                <td className="px-4 py-3"><span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.5 rounded text-[10px]">{item.reason}</span></td>
                <td className="px-4 py-3 text-gray-500 font-bold">{item.user}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Print Summary Footer */}
        <div className="border-t border-dashed border-gray-300 pt-4 mt-6 flex justify-between text-[10px] text-gray-400 font-mono">
          <span>Detailed Position Registry Report</span>
          <span>IDS PMS System • Generated: 14-JAN-2022</span>
          <span>Page 1 of 1</span>
        </div>

      </div>

      {/* Bottom return button */}
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

export default GuestBlockReport;
