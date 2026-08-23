import React from "react";
import { Search, Bell, SlidersHorizontal, BookOpen, Layers } from "lucide-react";

/**
 * Room Filter Bar Component - Controls for filtering and searching rooms
 */
export const RoomFilterBar = ({
  selectedType,
  setSelectedType,
  selectedFloor,
  setSelectedFloor,
  selectedFilterBy,
  setSelectedFilterBy,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  showSpecialOnly,
  setShowSpecialOnly,
  totalFilteredCount,
}) => {
  const roomTypes = ["All", "STD", "SGL", "DLX", "SUI", "FAM"];
  const floors = ["All", "1", "2", "3", "4", "5"];
  const filterByOptions = [
    { value: "All", label: "All Statuses" },
    { value: "Occupied", label: "Occupied" },
    { value: "Vacant Clean", label: "Vacant Clean" },
    { value: "Vacant Dirty", label: "Vacant Dirty" },
    { value: "Out of Order", label: "Out of Order" },
    { value: "Out of Service", label: "Out of Service" },
    { value: "Reservation", label: "Reservation" },
    { value: "Departure", label: "Departure" },
  ];

  return (
    <div
      id="room-filter-bar-container"
      className="bg-white border border-ids-border rounded-lg shadow-3xs p-3 select-none text-xs font-sans text-gray-800"
    >
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        
        {/* Dropdowns Row */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1 md:pb-0 shrink-0">
          
          {/* Room Type */}
          <div className="flex flex-col min-w-[120px]">
            <label className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Room Type</label>
            <select
              id="filter-room-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header font-semibold text-gray-700 cursor-pointer"
            >
              {roomTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Types" : t === "STD" ? "Standard" : t === "SGL" ? "Single" : t === "DLX" ? "Deluxe" : t === "SUI" ? "Suite" : "Family/VIP"}
                </option>
              ))}
            </select>
          </div>

          {/* Floor */}
          <div className="flex flex-col min-w-[90px]">
            <label className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Floor</label>
            <select
              id="filter-floor-dropdown"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header font-semibold text-gray-700 cursor-pointer"
            >
              {floors.map((f) => (
                <option key={f} value={f}>
                  {f === "All" ? "All Floors" : `Floor ${f}`}
                </option>
              ))}
            </select>
          </div>

          {/* Filter By Status */}
          <div className="flex flex-col min-w-[130px]">
            <label className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Status</label>
            <select
              id="filter-by-status"
              value={selectedFilterBy}
              onChange={(e) => setSelectedFilterBy(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header font-semibold text-gray-700 cursor-pointer"
            >
              {filterByOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search + Controls Row */}
        <div className="flex flex-1 items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          {/* Room Number Search */}
          <div className="relative min-w-[120px] flex-1 max-w-[200px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </span>
            <input
              id="search-room-no"
              type="text"
              placeholder="Search Room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 bg-gray-50 border border-ids-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ids-header font-semibold text-gray-800 font-mono"
            />
          </div>

          {/* Results Count */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {totalFilteredCount} Rooms
            </span>
          </div>

          {/* Special Rooms Toggle */}
          <button
            id="btn-special-rooms"
            onClick={() => setShowSpecialOnly(!showSpecialOnly)}
            className={`px-3 py-1 rounded font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center space-x-1.5 shrink-0 border ${
              showSpecialOnly
                ? "bg-red-500 border-red-600 text-white animate-pulse"
                : "bg-ids-sidebar border-ids-sidebar text-white hover:bg-ids-sidebar-hover"
            }`}
          >
            <Bell className="w-3 h-3 fill-current" />
            <span>VIP/Suite</span>
          </button>
        </div>

      </div>
    </div>
  );
};
