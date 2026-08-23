import React from "react";
import { Printer, ChevronLeft, ChevronRight, LogOut, CheckCircle } from "lucide-react";

/**
 * @param {Object} props
 * @param {Object} props.stats
 * @param {number} props.stats.vacant
 * @param {number} props.stats.dirty
 * @param {number} props.stats.occupied
 * @param {number} props.stats.oor
 * @param {number} props.stats.oos
 * @param {number} props.stats.reservation
 * @param {number} props.stats.departure
 * @param {number} props.stats.maskGuest
 * @param {number} props.stats.inspect
 * @param {number} props.pageSize
 * @param {function(number): void} props.setPageSize
 * @param {function(): void} props.onPrint
 * @param {function(): void} props.onExit
 */
export const RoomLegend = ({
  stats,
  pageSize,
  setPageSize,
  onPrint,
  onExit,
}) => {
  return (
    <div
      id="room-status-legend-bar"
      className="bg-white border border-ids-border rounded-lg shadow-3xs p-3 select-none text-xs font-sans text-gray-800 space-y-3"
    >
      {/* Legend Indicators with Live Counts */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-2.5 border-b border-ids-border/40">
        
        {/* Left: Legend Colored Boxes */}
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-green-500 rounded border border-black/10 inline-block shrink-0"></span>
            <span className="font-semibold text-[10px] sm:text-xs">Vacant</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-orange-400 rounded border border-black/10 inline-block shrink-0"></span>
            <span className="font-semibold text-[10px] sm:text-xs">Dirty</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-red-500 rounded border border-black/10 inline-block shrink-0"></span>
            <span className="font-semibold text-[10px] sm:text-xs">Occupied</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-blue-500 rounded border border-black/10 inline-block shrink-0"></span>
            <span className="font-semibold text-[10px] sm:text-xs">OOO</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-purple-500 rounded border border-black/10 inline-block shrink-0"></span>
            <span className="font-semibold text-[10px] sm:text-xs">OOS</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-yellow-400 rounded border border-black/10 inline-block shrink-0"></span>
            <span className="font-semibold text-[10px] sm:text-xs text-gray-700">Reservation</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-gray-400 rounded border border-black/10 inline-block shrink-0"></span>
            <span className="font-semibold text-[10px] sm:text-xs">Departure</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-sky-600 rounded-full border border-black/10 inline-block shrink-0"></span>
            <span className="font-semibold text-[10px] sm:text-xs">Mask Guest</span>
          </div>
        </div>

        {/* Right: Detailed Live Counts */}
        <div className="font-mono text-[10px] sm:text-[11px] font-bold text-ids-sidebar flex flex-wrap gap-1 leading-tight select-all">
          <span className="px-1.5 py-0.5 bg-green-50 rounded text-green-700 border border-green-200">{stats.vacant} Vacant</span>
          <span>|</span>
          <span className="px-1.5 py-0.5 bg-yellow-50 rounded text-yellow-700 border border-yellow-200">{stats.reservation} Reservation</span>
          <span>|</span>
          <span className="px-1.5 py-0.5 bg-orange-50 rounded text-orange-700 border border-orange-200">{stats.dirty} Dirty</span>
          <span>|</span>
          <span className="px-1.5 py-0.5 bg-blue-50 rounded text-blue-700 border border-blue-200">{stats.oor} OOO</span>
          <span>|</span>
          <span className="px-1.5 py-0.5 bg-purple-50 rounded text-purple-700 border border-purple-200">{stats.oos} OOS</span>
          <span>|</span>
          <span className="px-1.5 py-0.5 bg-sky-50 rounded text-sky-700 border border-sky-200">{stats.maskGuest || 0} Mask Guest</span>
          <span>|</span>
          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 border border-gray-300">{stats.departure || 0} Expected Departure</span>
          <span>|</span>
          <span className="px-1.5 py-0.5 bg-teal-50 rounded text-teal-700 border border-teal-200">{stats.inspect || 0} Inspect</span>
        </div>

      </div>

      {/* Bottom Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Page Size Selector */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-gray-500 uppercase text-[10px]">No. of Rooms/Page</span>
          <select
            id="legend-rooms-per-page"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 bg-gray-50 border border-ids-border rounded font-mono font-bold text-gray-700 cursor-pointer focus:outline-none"
          >
            <option value="40">40</option>
            <option value="60">60</option>
            <option value="80">80</option>
            <option value="100">100</option>
          </select>
        </div>

        {/* Buttons: Print, Previous, Next, Exit */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-print-status"
            onClick={onPrint}
            className="px-3.5 py-1.5 bg-ids-header hover:bg-ids-sidebar text-white font-bold rounded flex items-center space-x-1.5 shadow-3xs cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            id="btn-prev-page"
            disabled
            className="px-3.5 py-1.5 bg-gray-100 text-gray-400 border border-ids-border/30 font-bold rounded flex items-center space-x-1 shadow-3xs opacity-50 cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            id="btn-next-page"
            disabled
            className="px-3.5 py-1.5 bg-gray-100 text-gray-400 border border-ids-border/30 font-bold rounded flex items-center space-x-1 shadow-3xs opacity-50 cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-exit-status"
            onClick={onExit}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center space-x-1.5 shadow-3xs cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>

      </div>
    </div>
  );
};
