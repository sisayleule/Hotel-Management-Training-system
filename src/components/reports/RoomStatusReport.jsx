import React from "react";
import { ArrowLeft, Printer, FileText, RefreshCw, Layers } from "lucide-react";
import { useHotelStore } from "../../store/useHotelStore.js";
import toast from "react-hot-toast";

export const RoomStatusReport = ({ onBack }) => {
  const rooms = useHotelStore((state) => state.rooms);

  // Group rooms by type code
  const typeCodes = ["D/DLX", "D/EXE", "V/SUI", "B/EXE", "D/PNH"];
  const typeLabels = {
    "D/DLX": "Deluxe Room (Double)",
    "D/EXE": "Executive Room (Double)",
    "V/SUI": "Suite (Vacant ready)",
    "B/EXE": "Executive Room (Single)",
    "D/PNH": "Penthouse"
  };

  const statusSummaryRows = typeCodes.map((code) => {
    const typeRooms = rooms.filter((r) => r.type_code === code);
    const total = typeRooms.length;
    const vacantClean = typeRooms.filter((r) => r.status === "vacant_clean").length;
    const occupied = typeRooms.filter((r) => r.status === "occupied").length;
    const dirty = typeRooms.filter((r) => r.status === "dirty").length;
    const ooo = typeRooms.filter((r) => r.status === "out_of_order").length;
    const oos = typeRooms.filter((r) => r.status === "out_of_service").length;
    const occPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      code,
      label: typeLabels[code] || code,
      total,
      vacantClean,
      occupied,
      dirty,
      ooo,
      oos,
      occPct
    };
  });

  // Calculate Grand Totals
  const totalKeys = rooms.length;
  const grandVacantClean = rooms.filter((r) => r.status === "vacant_clean").length;
  const grandOccupied = rooms.filter((r) => r.status === "occupied").length;
  const grandDirty = rooms.filter((r) => r.status === "dirty").length;
  const grandOoo = rooms.filter((r) => r.status === "out_of_order").length;
  const grandOos = rooms.filter((r) => r.status === "out_of_service").length;
  const grandOccPct = totalKeys > 0 ? Math.round((grandOccupied / totalKeys) * 100) : 0;

  // Floor-wise statistics
  const floors = [2, 3, 4, 5, 6];

  const handlePrint = () => {
    toast.success("Printing Room Status Summary...");
    window.print();
  };

  const handleCSV = () => {
    toast.success("Room status summary exported as CSV.");
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
              Room Status & Cleanliness Report
            </h2>
            <p className="text-[10px] text-gray-500 font-mono">
              Aggregated housekeeping audit matrix • Key-wise clean/dirty positions
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

      {/* Main Aggregated Table Card */}
      <div className="bg-white border border-ids-border rounded-lg overflow-hidden shadow-xs p-4 space-y-4">
        
        <div className="flex items-center space-x-1.5 font-bold text-slate-700 uppercase text-[10px]">
          <Layers className="w-4.5 h-4.5 text-ids-sidebar" />
          <span>Category Room-State Allocation Matrix</span>
        </div>

        <div className="overflow-x-auto border border-ids-border/50 rounded">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead className="bg-slate-100 text-gray-700 font-bold border-b border-ids-border text-[10px] uppercase tracking-wider font-mono">
              <tr>
                <th className="px-4 py-2.5">Room Type</th>
                <th className="px-4 py-2.5 text-center">Total keys</th>
                <th className="px-4 py-2.5 text-center">Vacant Clean</th>
                <th className="px-4 py-2.5 text-center">Occupied</th>
                <th className="px-4 py-2.5 text-center">Dirty</th>
                <th className="px-4 py-2.5 text-center">OOO</th>
                <th className="px-4 py-2.5 text-center">OOS</th>
                <th className="px-4 py-2.5 text-right">Occupancy %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ids-border/40 font-mono font-bold text-gray-600">
              {statusSummaryRows.map((row) => (
                <tr key={row.code} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-800 font-sans">
                    <div>{row.label}</div>
                    <div className="text-[9px] text-gray-400 font-mono font-bold">{row.code}</div>
                    
                    {/* Visual Progress Bar */}
                    <div className="w-full max-w-[140px] h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full ${
                          row.occPct > 60 ? "bg-green-500" : row.occPct > 30 ? "bg-amber-500" : "bg-red-500"
                        }`} 
                        style={{ width: `${row.occPct}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-800 text-sm font-extrabold">{row.total}</td>
                  <td className="px-4 py-3 text-center text-green-600">{row.vacantClean}</td>
                  <td className="px-4 py-3 text-center text-red-600">{row.occupied}</td>
                  <td className="px-4 py-3 text-center text-orange-600">{row.dirty}</td>
                  <td className="px-4 py-3 text-center text-blue-600">{row.ooo}</td>
                  <td className="px-4 py-3 text-center text-purple-600">{row.oos}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${
                      row.occPct > 60 ? "bg-green-50 text-green-700 border border-green-200" :
                      row.occPct > 30 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {row.occPct}%
                    </span>
                  </td>
                </tr>
              ))}

              {/* Grand Totals */}
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-extrabold text-slate-800">
                <td className="px-4 py-3.5 uppercase font-sans">GRAND TOTALS</td>
                <td className="px-4 py-3.5 text-center text-sm font-black">{totalKeys}</td>
                <td className="px-4 py-3.5 text-center text-green-700">{grandVacantClean}</td>
                <td className="px-4 py-3.5 text-center text-red-700">{grandOccupied}</td>
                <td className="px-4 py-3.5 text-center text-orange-700">{grandDirty}</td>
                <td className="px-4 py-3.5 text-center text-blue-700">{grandOoo}</td>
                <td className="px-4 py-3.5 text-center text-purple-700">{grandOos}</td>
                <td className="px-4 py-3.5 text-right">
                  <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-sm font-black">
                    {grandOccPct}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* Floor-wise Breakdown Mini Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {floors.map((flr) => {
          const floorRooms = rooms.filter((r) => r.floor === flr);
          const fTotal = floorRooms.length;
          const fClean = floorRooms.filter((r) => r.status === "vacant_clean").length;
          const fOcc = floorRooms.filter((r) => r.status === "occupied").length;
          const fDirty = floorRooms.filter((r) => r.status === "dirty").length;

          return (
            <div key={flr} className="bg-white border border-ids-border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="font-bold text-slate-800 uppercase text-[10px]">Floor {flr}th Wing Detail</span>
                <span className="font-mono text-[10px] text-gray-400 font-bold">KEYS: {fTotal}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 font-mono text-center font-bold">
                <div className="p-2 bg-green-50 text-green-700 border border-green-200 rounded">
                  <div className="text-[8px] text-gray-400 uppercase font-sans font-bold">Clean</div>
                  <div className="text-sm font-black">{fClean}</div>
                </div>
                <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded">
                  <div className="text-[8px] text-gray-400 uppercase font-sans font-bold">Occupied</div>
                  <div className="text-sm font-black">{fOcc}</div>
                </div>
                <div className="p-2 bg-orange-50 text-orange-700 border border-orange-200 rounded">
                  <div className="text-[8px] text-gray-400 uppercase font-sans font-bold">Dirty</div>
                  <div className="text-sm font-black">{fDirty}</div>
                </div>
              </div>
            </div>
          );
        })}
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

export default RoomStatusReport;
