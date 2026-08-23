import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useHotelStore } from "../store/useHotelStore.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { RoomCard } from "../components/rooms/RoomCard.jsx";
import { RoomFilterBar } from "../components/rooms/RoomFilterBar.jsx";
import { RoomLegend } from "../components/rooms/RoomLegend.jsx";
import { RoomDetailSheet } from "../components/rooms/RoomDetailSheet.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { Bell, Info, RefreshCw, Layers, Printer, Sliders } from "lucide-react";
import toast from "react-hot-toast";

export const RoomStatus = () => {
  // Store hooks
  const rooms = useHotelStore((state) => state.rooms);
  const selectedDate = useHotelStore((state) => state.selectedDate);
  const resetToDemo = useHotelStore((state) => state.resetToDemo);

  // Component States
  const [selectedType, setSelectedType] = useState("All");
  const [selectedFloor, setSelectedFloor] = useState("All");
  const [selectedFilterBy, setSelectedFilterBy] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(80);
  const [showSpecialOnly, setShowSpecialOnly] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulated initial load for premium skeleton pulses
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Filter logic - AND logic across all variables
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Room Type filter
      if (selectedType !== "All" && room.type_code !== selectedType) {
        return false;
      }
      // Floor filter
      if (selectedFloor !== "All" && room.floor !== Number(selectedFloor)) {
        return false;
      }
      // "Filter By" Status filter
      if (selectedFilterBy !== "All") {
        const fb = selectedFilterBy.toLowerCase();
        if (fb === "occupied" && room.status !== "occupied") return false;
        if (fb === "vacant clean" && room.status !== "vacant_clean") return false;
        if (fb === "vacant dirty" && room.status !== "dirty" && room.status !== "vacant_dirty") return false;
        if (fb === "out of order" && room.status !== "out_of_order" && room.status !== "not_available") return false;
        if (fb === "out of service" && room.status !== "out_of_service" && room.status !== "oos") return false;
        if (fb === "reservation" && room.status !== "reservation") return false;
        if (fb === "departure" && room.status !== "departure") return false;
      }
      // Search Query filter (prefix, match or suffix - case insensitive)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.trim().toLowerCase();
        if (!room.room_no.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Special rooms toggle (VIP / Suites / Penthouses / Smoking permitted)
      if (showSpecialOnly) {
        const code = room.type_code.toLowerCase();
        const isSuite = code.includes("sui") || code.includes("pnh");
        const isSmoking = room.is_smoking;
        if (!isSuite && !isSmoking) {
          return false;
        }
      }
      return true;
    });
  }, [rooms, selectedType, selectedFloor, selectedFilterBy, searchQuery, showSpecialOnly]);

  // Handle opening detailed operational bottom sheet / modal
  const handleRoomClick = useCallback((room) => {
    setActiveRoom(room);
  }, []);

  // Exit trigger back to dashboard
  const handleExit = useCallback(() => {
    window.location.href = "/dashboard";
  }, []);

  // Print trigger with print styles
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Compute live statistics for Legend bar from Zustand rooms store
  const stats = useMemo(() => {
    const rawRooms = rooms;
    return {
      vacant: rawRooms.filter((r) => r.status === "vacant_clean").length,
      dirty: rawRooms.filter((r) => r.status === "vacant_dirty" || r.status === "dirty").length,
      occupied: rawRooms.filter((r) => r.status === "occupied").length,
      oor: rawRooms.filter((r) => r.status === "out_of_order" || r.status === "not_available").length,
      oos: rawRooms.filter((r) => r.status === "out_of_service" || r.status === "oos").length,
      reservation: rawRooms.filter((r) => r.status === "reservation").length,
      departure: rawRooms.filter((r) => r.status === "departure").length,
      maskGuest: rawRooms.filter((r) => r.status === "mask_guest").length,
      inspect: rawRooms.filter((r) => r.status === "inspect").length,
    };
  }, [rooms]);

  // Grouping by Floor for structured, organized layout
  const floorsGrouped = useMemo(() => {
    const groups = {};
    filteredRooms.forEach((room) => {
      const fl = room.floor;
      if (!groups[fl]) {
        groups[fl] = [];
      }
      groups[fl].push(room);
    });
    // Sort keys descending so highest floor (e.g. Penthouse Floor 6) is at top, or floor 2 first
    // In hotel PMS, Floor 2 is lowest and floor 6 is top. Let's list from lowest floor to highest or highest to lowest. Let's do lowest (2) to highest (6) as it flows naturally!
    return Object.keys(groups)
      .sort((a, b) => Number(a) - Number(b))
      .map((fl) => ({
        floor: Number(fl),
        rooms: groups[fl].sort((a, b) => a.room_no.localeCompare(b.room_no)),
      }));
  }, [filteredRooms]);

  return (
    <PageWrapper
      title="Room Status V6.5.002.1"
      subtitle="Interactive Room Management Board mirroring Fortune IDS Next front-office system layout"
    >
      {/* Embedded print CSS to handle perfect reports */}
      <style>{`
        @media print {
          body, html, #root {
            background: white !important;
            color: black !important;
          }
          #sidebar-nav, #top-header-bar, #room-filter-bar-container, #btn-special-rooms, #bottom-sheet-container, #room-status-legend-bar select, #room-status-legend-bar button {
            display: none !important;
          }
          #main-page-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .floor-grid-section {
            page-break-inside: avoid;
          }
        }
        .print-header {
          display: none;
        }
      `}</style>

      {/* Print Only Header */}
      <div className="print-header font-sans text-center text-gray-900 select-none pb-4">
        <h1 className="text-xl font-black uppercase tracking-wider">ROOM STATUS REPORT</h1>
        <p className="text-sm font-bold uppercase mt-1">DEMO TRAINING HOTEL — DATE: {selectedDate}</p>
        <p className="text-[10px] font-semibold text-gray-500 font-mono mt-0.5">GENERATED BY MANAGER / IT ADMIN</p>
      </div>

      <div id="room-status-page-layout" className="space-y-4">
        
        {/* Dynamic Filter dropdowns */}
        <RoomFilterBar
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedBlock={null}
          setSelectedBlock={() => {}}
          selectedFloor={selectedFloor}
          setSelectedFloor={setSelectedFloor}
          selectedFilterBy={selectedFilterBy}
          setSelectedFilterBy={setSelectedFilterBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          showSpecialOnly={showSpecialOnly}
          setShowSpecialOnly={setShowSpecialOnly}
          totalFilteredCount={filteredRooms.length}
        />

        {/* Info Banner showing active search state */}
        {(selectedType !== "All" ||
          selectedFloor !== "All" ||
          selectedFilterBy !== "All" ||
          searchQuery.trim() !== "" ||
          showSpecialOnly) && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded text-xs select-none">
            <div className="flex items-center space-x-1.5 font-bold text-orange-800">
              <Info className="w-4 h-4 text-orange-600 shrink-0" />
              <span>ACTIVE FILTERS: Showing {filteredRooms.length} matching units.</span>
            </div>
            <button
              onClick={() => {
                setSelectedType("All");
                setSelectedFloor("All");
                setSelectedFilterBy("All");
                setSearchQuery("");
                setShowSpecialOnly(false);
                toast.success("All filters cleared ✓");
              }}
              className="font-bold text-orange-700 hover:underline cursor-pointer text-[11px]"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {isLoading ? (
          /* Premium loading pulse skeleton grid (8 slots shown) */
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 xl:grid-cols-10 gap-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full h-[56px] sm:h-[64px] lg:h-[68px] rounded bg-gray-200 animate-pulse border border-gray-300"
              ></div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white border border-ids-border rounded-lg py-12">
            <EmptyState
              title="No Matching Rooms Found"
              description="No physical room units match your current filter query options. Reset or clear filters to view hotel status."
            />
          </div>
        ) : (
          /* Floor by Floor organized Grid view */
          <div className="space-y-5">
            {floorsGrouped.map(({ floor, rooms }) => (
              <div key={floor} className="floor-grid-section bg-white/40 border border-ids-border/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2 border-b border-ids-border/40 pb-1 text-[11px] font-black uppercase text-ids-sidebar select-none">
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    Floor {floor} — {rooms.length} rooms
                  </span>
                  <span className="text-gray-400 font-mono font-normal tracking-tight normal-case ml-1.5">
                    (Rooms {rooms[0]?.room_no} to {rooms[rooms.length - 1]?.room_no})
                  </span>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 xl:grid-cols-10 gap-2">
                  {rooms.map((room) => (
                    <RoomCard key={room.room_no} room={room} onClick={handleRoomClick} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend Bar + Dynamic Statistics counts */}
        <RoomLegend
          stats={stats}
          pageSize={pageSize}
          setPageSize={setPageSize}
          onPrint={handlePrint}
          onExit={handleExit}
        />

        {/* Detailed action slide-up bottom sheet */}
        <RoomDetailSheet
          isOpen={!!activeRoom}
          onClose={() => setActiveRoom(null)}
          room={activeRoom}
        />

      </div>
    </PageWrapper>
  );
};

export default RoomStatus;
