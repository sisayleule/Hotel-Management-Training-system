import React, { useState } from "react";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { getRoomStatusColors, getStatusLabel } from "../utils/roomUtils.js";
import { 
  Check, RefreshCw, Sparkles, Filter, ShieldCheck, Home, 
  Grid, List, Wrench, AlertCircle, Info, ChevronRight, UserCheck 
} from "lucide-react";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useHotelStore } from "../store/useHotelStore.js";
import { HouseKeepingCard } from "../components/housekeeping/HouseKeepingCard.jsx";
import { HousekeeperAssign } from "../components/housekeeping/HousekeeperAssign.jsx";
import toast from "react-hot-toast";
import { RequirePermission } from "../components/auth/RequirePermission.jsx";
import { PERMISSIONS } from "../config/rbac.js";

export const HouseKeeping = () => {
  const { rooms, updateRoomHousekeeping, housekeeperStaff } = useHotelStore();
  const [filterState, setFilterState] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid or list view
  const [selectedRoomNo, setSelectedRoomNo] = useState(null);

  // Filter logic
  const filteredRooms = rooms.filter((room) => {
    if (filterState === "all") return true;
    if (filterState === "clean") return room.status === "vacant_clean";
    if (filterState === "dirty") return room.status === "dirty";
    if (filterState === "ooo") return room.status === "out_of_order" || room.status === "out_of_service";
    if (filterState === "occupied") return room.status === "occupied";
    return true;
  });

  const dirtyCount = rooms.filter((r) => r.status === "dirty").length;
  const cleanCount = rooms.filter((r) => r.status === "vacant_clean").length;
  const occupiedCount = rooms.filter((r) => r.status === "occupied").length;
  const oooCount = rooms.filter((r) => r.status === "out_of_order" || r.status === "out_of_service").length;

  const handleSetClean = (roomNo, e) => {
    e.stopPropagation(); // prevent opening details sheet
    updateRoomHousekeeping(roomNo, { status: "vacant_clean" });
    toast.success(`Room ${roomNo} status updated to Vacant Clean`);
  };

  const handleSetDirty = (roomNo, e) => {
    e.stopPropagation(); // prevent opening details sheet
    updateRoomHousekeeping(roomNo, { status: "dirty" });
    toast.success(`Room ${roomNo} status updated to Vacant Dirty`);
  };

  return (
      <PageWrapper
        title="Housekeeping & Cleanliness Board"
        subtitle="Manage room hygiene status, staff key assignments, and track active maintenance requests"
      >
        <div className="space-y-6">
          
          {/* Collapsible Housekeeper Assign Dashboard */}
          <HousekeeperAssign />

          {/* Stats summaries */}
          <div id="hk-summary-panels" className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none text-xs">
            <div className="bg-white border border-ids-border p-4 rounded shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Dirty Rooms</span>
                <p className="text-2xl font-mono font-bold text-orange-600 mt-1">{dirtyCount}</p>
              </div>
              <div className="p-2 bg-orange-50 border border-orange-200 text-orange-500 rounded shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-ids-border p-4 rounded shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Clean Rooms</span>
                <p className="text-2xl font-mono font-bold text-green-600 mt-1">{cleanCount}</p>
              </div>
              <div className="p-2 bg-green-50 border border-green-200 text-green-500 rounded shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-ids-border p-4 rounded shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Occupied Rooms</span>
                <p className="text-2xl font-mono font-bold text-red-600 mt-1">{occupiedCount}</p>
              </div>
              <div className="p-2 bg-red-50 border border-red-200 text-red-500 rounded shrink-0">
                <Home className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-ids-border p-4 rounded shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">OOO / Maintenance</span>
                <p className="text-2xl font-mono font-bold text-blue-600 mt-1">{oooCount}</p>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 text-blue-500 rounded shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Bar with Grid/List Toggle */}
          <div id="hk-filters" className="bg-white border border-ids-border p-4 rounded shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4 select-none text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-ids-header shrink-0" />
              <span className="font-bold text-gray-600 uppercase tracking-wider">Filters:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: `All Rooms (${rooms.length})` },
                  { id: "clean", label: `Clean (${cleanCount})` },
                  { id: "dirty", label: `Dirty (${dirtyCount})` },
                  { id: "occupied", label: `Occupied (${occupiedCount})` },
                  { id: "ooo", label: `OOO (${oooCount})` }
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`hk-filter-${item.id}`}
                    onClick={() => setFilterState(item.id)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      filterState === item.id
                        ? "bg-ids-header text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid/List layout toggle */}
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-gray-400 font-bold uppercase text-[10px]">View Mode:</span>
              <div className="flex bg-slate-100 p-0.5 border border-ids-border rounded">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-white text-slate-800 shadow-3xs" : "text-gray-400 hover:text-gray-600"}`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-white text-slate-800 shadow-3xs" : "text-gray-400 hover:text-gray-600"}`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Rooms Grid Layout */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => {
                  const clr = getRoomStatusColors(room.status);
                  const hkName = housekeeperStaff.find(s => s.id === room.housekeeper_id)?.name;

                  return (
                    <div
                      key={room.room_no}
                      onClick={() => setSelectedRoomNo(room.room_no)}
                      className={`border p-3 rounded-lg shadow-3xs cursor-pointer hover:shadow-md transition-all relative overflow-hidden group select-none flex flex-col justify-between h-24 ${clr.lightBg} ${clr.border}`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`text-xs font-mono font-black ${clr.lightText}`}>Room {room.room_no}</span>
                          <span className="text-[8px] bg-white/70 px-1 py-0.2 rounded text-gray-500 font-bold font-mono uppercase">{room.type_code}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold mt-1 font-sans capitalize">{getStatusLabel(room.status)}</p>
                      </div>

                      {/* Cleaner Assignment details */}
                      <div className="mt-2 text-[9px] text-slate-500 font-medium font-sans flex items-center justify-between border-t border-slate-100/50 pt-1">
                        <span className="truncate max-w-[80px] font-bold">
                          {hkName ? `🧹 ${hkName.split(' ')[0]}` : "No cleaner"}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Color strip accent on left */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1 ${clr.lightText}`} style={{ backgroundColor: "currentColor" }}></div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    title="No rooms matching filter"
                    description="No rooms are currently found matching the cleanliness filters applied."
                    icon={Home}
                  />
                </div>
              )}
            </div>
          )}

          {/* Rooms List Layout (Original Table) */}
          {viewMode === "list" && (
            <div id="hk-rooms-table-wrapper" className="bg-white border border-ids-border rounded overflow-hidden shadow-xs overflow-x-auto select-none">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead className="bg-slate-800 text-white font-bold border-b border-ids-border">
                  <tr>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Floor / Wing Block</th>
                    <th className="px-4 py-3">Current Status</th>
                    <th className="px-4 py-3">Staff Assignment</th>
                    <th className="px-4 py-3 text-center font-bold">Hygiene Action Workflows</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ids-border/40">
                  {filteredRooms.length > 0 ? (
                    filteredRooms.map((room) => {
                      const clr = getRoomStatusColors(room.status);
                      const staffName = housekeeperStaff.find(s => s.id === room.housekeeper_id)?.name || "Unassigned";

                      return (
                        <tr 
                          key={room.room_no} 
                          onClick={() => setSelectedRoomNo(room.room_no)}
                          className="hover:bg-ids-bg/15 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 font-mono font-bold text-sm text-ids-header">
                            Room {room.room_no}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-500">
                            {room.type_name} ({room.type_code})
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            Floor {room.floor}th • Wing Block {room.block || "BA-FF02"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] border ${clr.lightBg} ${clr.lightText} ${clr.border}`}>
                              {getStatusLabel(room.status).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-semibold font-mono">
                            {staffName}
                          </td>
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center space-x-2">
                              <RequirePermission permission={PERMISSIONS.HOUSEKEEPING_UPDATE_STATUS}>
                                <button
                                  onClick={(e) => handleSetClean(room.room_no, e)}
                                  disabled={room.status === "vacant_clean"}
                                  className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white font-bold text-[10px] rounded flex items-center space-x-1 disabled:opacity-40 shadow-3xs"
                                  title="Release Clean Room"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Release Clean</span>
                                </button>
                              </RequirePermission>
                              <RequirePermission permission={PERMISSIONS.HOUSEKEEPING_UPDATE_STATUS}>
                                <button
                                  onClick={(e) => handleSetDirty(room.room_no, e)}
                                  disabled={room.status === "dirty"}
                                  className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] rounded flex items-center space-x-1 disabled:opacity-40 shadow-3xs"
                                  title="Report Vacant Dirty"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Report Dirty</span>
                                </button>
                              </RequirePermission>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8">
                        <EmptyState
                          title="No rooms matching filter"
                          description="No rooms are currently found matching the cleanliness filters applied."
                          icon={Home}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Dynamic Housekeeping details Slide-over/Card */}
        {selectedRoomNo && (
          <HouseKeepingCard 
            roomNo={selectedRoomNo} 
            onClose={() => setSelectedRoomNo(null)} 
          />
        )}
      </PageWrapper>
  );
};

export default HouseKeeping;
