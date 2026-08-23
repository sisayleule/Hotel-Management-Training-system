import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHotelStore } from "../store/useHotelStore.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { ReservationStatusBadge } from "../components/reservations/ReservationStatusBadge.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";
import { Home, Search, X, Check, AlertCircle, Filter, Grid, List, Bed } from "lucide-react";
import toast from "react-hot-toast";

export default function AssignRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Store
  const reservations = useHotelStore((state) => state.reservations);
  const rooms = useHotelStore((state) => state.rooms);
  const assignRoomToReservation = useHotelStore((state) => state.assignRoomToReservation);
  const currentUser = useHotelStore((state) => state.currentUser);

  // Local State
  const [mode, setMode] = useState("search"); // "search" | "assigning"
  const [searchCriteria, setSearchCriteria] = useState({
    reservation_no: "",
    guest_name: "",
    arrival: "",
    departure: "",
    status: ""
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedRoomNo, setSelectedRoomNo] = useState(null);
  const [roomFilters, setRoomFilters] = useState({
    floor: "",
    type: "",
    status: "",
    availableOnly: false
  });
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "floor"
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmMismatch, setConfirmMismatch] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-load reservation from URL parameter
  useEffect(() => {
    const reservationId = searchParams.get("id");
    if (reservationId) {
      loadReservation(reservationId);
    }
  }, [searchParams]);

  // Search handler with AND logic
  const handleSearch = () => {
    setErrors({});

    const hasAnyCriteria = Object.values(searchCriteria).some(val => val.trim() !== "");
    if (!hasAnyCriteria) {
      setSearchResults([]);
      return;
    }

    let results = [...reservations];

    if (searchCriteria.reservation_no.trim()) {
      const q = searchCriteria.reservation_no.toLowerCase().trim();
      results = results.filter(r => r.reservation_no.toLowerCase().includes(q));
    }

    if (searchCriteria.guest_name.trim()) {
      const q = searchCriteria.guest_name.toLowerCase().trim();
      results = results.filter(r => r.guest_name.toLowerCase().includes(q));
    }

    if (searchCriteria.arrival) {
      results = results.filter(r => r.arrival === searchCriteria.arrival);
    }

    if (searchCriteria.departure) {
      results = results.filter(r => r.departure === searchCriteria.departure);
    }

    if (searchCriteria.status) {
      results = results.filter(r => r.status === searchCriteria.status);
    }

    setSearchResults(results);

    if (results.length === 1) {
      loadReservation(results[0].reservation_no);
    } else if (results.length === 0) {
      toast.error("No reservations found matching your search criteria");
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchCriteria({
      reservation_no: "",
      guest_name: "",
      arrival: "",
      departure: "",
      status: ""
    });
    setSearchResults([]);
    setErrors({});
  };

  // Load reservation into assignment mode
  const loadReservation = (reservationNo) => {
    const reservation = reservations.find(r => r.reservation_no === reservationNo);
    if (!reservation) {
      toast.error("Reservation not found - it may have been deleted");
      setMode("search");
      return;
    }

    setSelectedReservation(reservation);
    setMode("assigning");
    setRoomFilters({ floor: "", type: "", status: "", availableOnly: false });
  };

  // Back to search
  const handleBackToSearch = () => {
    setMode("search");
    setSelectedReservation(null);
    setSelectedRoomNo(null);
    setShowConfirmDialog(false);
    setConfirmMismatch(false);
  };

  // Filter rooms with useMemo
  const filteredRooms = useMemo(() => {
    let filtered = [...rooms];

    if (roomFilters.floor) {
      filtered = filtered.filter(r => r.floor === parseInt(roomFilters.floor));
    }

    if (roomFilters.type) {
      filtered = filtered.filter(r => r.type_code === roomFilters.type);
    }

    if (roomFilters.status) {
      filtered = filtered.filter(r => r.status === roomFilters.status);
    }

    if (roomFilters.availableOnly) {
      filtered = filtered.filter(r => r.status === "vacant_clean");
    }

    return filtered;
  }, [rooms, roomFilters]);

  // Group rooms by floor
  const roomsByFloor = useMemo(() => {
    const grouped = {};
    filteredRooms.forEach(room => {
      if (!grouped[room.floor]) {
        grouped[room.floor] = [];
      }
      grouped[room.floor].push(room);
    });
    return Object.entries(grouped).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [filteredRooms]);

  // Handle assign room button click
  const handleAssignRoom = (roomNo) => {
    const room = rooms.find(r => r.room_no === roomNo);
    
    const blockedStatuses = ["occupied", "out_of_service", "blocked", "maintenance", "under_maintenance"];
    if (blockedStatuses.includes(room.status)) {
      toast.error(`This room is ${room.status} and cannot be assigned`);
      return;
    }

    if (room.guest_name && room.guest_name.trim() !== "") {
      toast.error("This room is currently occupied");
      return;
    }

    setSelectedRoomNo(roomNo);
    setConfirmMismatch(false);
    setShowConfirmDialog(true);
  };

  // Confirm assignment
  const confirmAssignment = () => {
    try {
      const room = rooms.find(r => r.room_no === selectedRoomNo);
      
      // Check if changing assignment
      if (selectedReservation.rooms_assigned && selectedReservation.rooms_assigned.length > 0) {
        const oldRoomNo = selectedReservation.rooms_assigned[0];
        
        // Release old room
        const oldRoom = rooms.find(r => r.room_no === oldRoomNo);
        if (oldRoom) {
          // This would be handled by store action - for now just assign new room
        }
        
        toast.success(`Room assignment changed from ${oldRoomNo} to ${selectedRoomNo} ✓`);
      } else {
        toast.success(`Room ${selectedRoomNo} assigned successfully ✓`);
      }

      assignRoomToReservation(selectedReservation.reservation_no, selectedRoomNo);
      
      setShowConfirmDialog(false);
      setSelectedRoomNo(null);
      setConfirmMismatch(false);
      
      // Refresh reservation data
      const updatedReservation = reservations.find(r => r.reservation_no === selectedReservation.reservation_no);
      setSelectedReservation(updatedReservation);
    } catch (error) {
      toast.error("Assignment failed - please try again");
    }
  };

  // Room type compatibility check
  const getRoomTypeCompatibility = () => {
    if (!selectedReservation || !selectedRoomNo) return { compatible: true };
    
    const room = rooms.find(r => r.room_no === selectedRoomNo);
    if (!room) return { compatible: true };

    const resType = selectedReservation.room_type;
    const roomType = room.type_code;

    if (resType === roomType) {
      return { compatible: true, mismatch: false };
    }

    const hierarchy = { "STD": 1, "DLX": 2, "EXEC": 3, "SUI": 4 };
    const resLevel = hierarchy[resType] || 0;
    const roomLevel = hierarchy[roomType] || 0;

    if (roomLevel > resLevel) {
      return {
        compatible: true,
        mismatch: true,
        isUpgrade: true,
        message: `⬆️ Upgrade: Assigning ${roomType} to ${resType} reservation`
      };
    } else if (roomLevel < resLevel) {
      return {
        compatible: true,
        mismatch: true,
        isUpgrade: false,
        message: `⬇️ Downgrade: Assigning ${roomType} to ${resType} reservation`
      };
    }

    return { compatible: true, mismatch: false };
  };

  const compatibility = getRoomTypeCompatibility();
  const selectedRoom = rooms.find(r => r.room_no === selectedRoomNo);
  const isDirtyRoom = selectedRoom?.status === "dirty";
  const currentRoom = selectedReservation?.rooms_assigned?.[0];

  // Get unique floors for filter
  const uniqueFloors = useMemo(() => {
    const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
    return floors;
  }, [rooms]);

  // Get unique room types for filter
  const uniqueRoomTypes = useMemo(() => {
    const types = [...new Set(rooms.map(r => r.type_code))].sort();
    return types;
  }, [rooms]);

  // Render room status badge
  const getRoomStatusBadge = (status) => {
    const statusConfig = {
      "vacant_clean": { color: "bg-green-100 text-green-800", label: "READY" },
      "ready": { color: "bg-green-100 text-green-800", label: "READY" },
      "reservation": { color: "bg-blue-100 text-blue-800", label: "RESERVED" },
      "reserved": { color: "bg-blue-100 text-blue-800", label: "RESERVED" },
      "occupied": { color: "bg-orange-100 text-orange-800", label: "OCCUPIED" },
      "dirty": { color: "bg-yellow-100 text-yellow-800", label: "DIRTY" },
      "out_of_service": { color: "bg-red-100 text-red-800", label: "OUT OF SERVICE" },
      "blocked": { color: "bg-gray-100 text-gray-800", label: "BLOCKED" },
      "maintenance": { color: "bg-purple-100 text-purple-800", label: "MAINTENANCE" },
      "under_maintenance": { color: "bg-purple-100 text-purple-800", label: "MAINTENANCE" }
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status.toUpperCase() };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Check if room is available
  const isRoomAvailable = (room) => {
    const blockedStatuses = ["occupied", "out_of_service", "blocked", "maintenance", "under_maintenance"];
    return !blockedStatuses.includes(room.status) && (!room.guest_name || room.guest_name.trim() === "");
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const day = parts[2];
        const month = months[parseInt(parts[1]) - 1];
        const year = parts[0];
        return `${day}-${month}-${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Keyboard navigation - Enter as Tab for search form
  const searchFormRef = useEnterAsTab({ onSubmit: (e) => {
    e.preventDefault();
    handleSearch();
  }});

  return (
    <PageWrapper 
      title="Assign Room" 
      icon={Home}
      backPath="/reservations"
      description="Search reservations and assign available rooms"
    >
      {mode === "search" ? (
        <div className="space-y-6">
          {/* Search Form */}
          <form 
            ref={searchFormRef}
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6"
          >
            <h2 className="text-sm font-black text-ids-sidebar uppercase tracking-wider mb-4">
              Search Reservations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Reservation No.
                </label>
                <input
                  id="search-resno"
                  type="text"
                  value={searchCriteria.reservation_no}
                  onChange={(e) => setSearchCriteria({...searchCriteria, reservation_no: e.target.value})}
                  className="w-full px-3 py-2 border border-ids-border rounded text-xs font-mono focus:outline-none focus:border-ids-sidebar"
                  placeholder="RES001"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Guest Name
                </label>
                <input
                  id="search-guest"
                  type="text"
                  value={searchCriteria.guest_name}
                  onChange={(e) => setSearchCriteria({...searchCriteria, guest_name: e.target.value})}
                  className="w-full px-3 py-2 border border-ids-border rounded text-xs focus:outline-none focus:border-ids-sidebar"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Arrival Date
                </label>
                <input
                  id="search-arrival"
                  type="date"
                  value={searchCriteria.arrival}
                  onChange={(e) => setSearchCriteria({...searchCriteria, arrival: e.target.value})}
                  className="w-full px-3 py-2 border border-ids-border rounded text-xs focus:outline-none focus:border-ids-sidebar"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Departure Date
                </label>
                <input
                  id="search-departure"
                  type="date"
                  value={searchCriteria.departure}
                  onChange={(e) => setSearchCriteria({...searchCriteria, departure: e.target.value})}
                  className="w-full px-3 py-2 border border-ids-border rounded text-xs focus:outline-none focus:border-ids-sidebar"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Booking Status
                </label>
                <select
                  id="search-status"
                  value={searchCriteria.status}
                  onChange={(e) => setSearchCriteria({...searchCriteria, status: e.target.value})}
                  className="w-full px-3 py-2 border border-ids-border rounded text-xs focus:outline-none focus:border-ids-sidebar"
                >
                  <option value="">All</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 md:flex-none px-6 py-3 bg-ids-sidebar text-white rounded text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <button
                type="button"
                onClick={handleClearSearch}
                className="flex-1 md:flex-none px-6 py-3 bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6">
              <h2 className="text-sm font-black text-ids-sidebar uppercase tracking-wider mb-4">
                Search Results ({searchResults.length})
              </h2>
              <div className="space-y-2">
                {searchResults.map((res) => (
                  <div
                    key={res.reservation_no}
                    onClick={() => loadReservation(res.reservation_no)}
                    className="border border-ids-border bg-white p-3 rounded shadow-3xs hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono font-bold text-ids-sidebar">{res.reservation_no}</span>
                      <ReservationStatusBadge status={res.status} />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><span className="font-semibold">Guest:</span> {res.guest_name}</p>
                      <p><span className="font-semibold">Room Type:</span> {res.room_type}</p>
                      <p><span className="font-semibold">Arrival:</span> {formatDate(res.arrival)}</p>
                      <p><span className="font-semibold">Current Room:</span> {res.rooms_assigned?.[0] || "Not Assigned"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Reservation Summary */}
          <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-sm font-black text-ids-sidebar uppercase tracking-wider">
                Reservation Details
              </h2>
              <ReservationStatusBadge status={selectedReservation?.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 uppercase tracking-wider mb-1">Reservation No.</p>
                <p className="font-mono font-bold text-ids-sidebar">{selectedReservation?.reservation_no}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase tracking-wider mb-1">Guest Name</p>
                <p className="text-ids-sidebar">{selectedReservation?.guest_name}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase tracking-wider mb-1">Arrival</p>
                <p className="font-mono">{formatDate(selectedReservation?.arrival)}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase tracking-wider mb-1">Departure</p>
                <p className="font-mono">{formatDate(selectedReservation?.departure)}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase tracking-wider mb-1">Nights</p>
                <p>{selectedReservation?.nights}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase tracking-wider mb-1">Room Type</p>
                <p className="font-bold">{selectedReservation?.room_type}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase tracking-wider mb-1">Adults</p>
                <p>{selectedReservation?.adults}</p>
              </div>

              <div>
                <p className="text-gray-400 uppercase tracking-wider mb-1">Children</p>
                <p>{selectedReservation?.children}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-gray-400 uppercase tracking-wider mb-1">Current Assignment</p>
                <div className={`${currentRoom ? 'bg-amber-50 border-amber-200 border p-2 rounded' : ''}`}>
                  <p className="font-mono font-bold">
                    {currentRoom || "No Room Assigned"}
                  </p>
                </div>
              </div>

              {selectedReservation?.special_requests && (
                <div className="md:col-span-2">
                  <p className="text-gray-400 uppercase tracking-wider mb-1">Special Requests</p>
                  <p className="text-gray-600">{selectedReservation.special_requests}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleBackToSearch}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors"
            >
              Back to Search
            </button>
          </div>

          {/* Room Filters */}
          <div className="bg-white border border-ids-border rounded-lg shadow-3xs p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black text-ids-sidebar uppercase tracking-wider">
                Available Rooms
              </h2>
              
              {/* View Toggle */}
              <div className="flex gap-1 border border-ids-border rounded p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    viewMode === "grid" ? "bg-ids-sidebar text-white" : "bg-white text-gray-700"
                  }`}
                >
                  <Grid className="w-4 h-4 inline" /> Grid
                </button>
                <button
                  onClick={() => setViewMode("floor")}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    viewMode === "floor" ? "bg-ids-sidebar text-white" : "bg-white text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4 inline" /> Floor
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                  <Filter className="w-3 h-3 inline" /> Floor
                </label>
                <select
                  value={roomFilters.floor}
                  onChange={(e) => setRoomFilters({...roomFilters, floor: e.target.value})}
                  className="w-full px-3 py-2 border border-ids-border rounded text-xs focus:outline-none focus:border-ids-sidebar"
                >
                  <option value="">All Floors</option>
                  {uniqueFloors.map(floor => (
                    <option key={floor} value={floor}>Floor {floor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Room Type
                </label>
                <select
                  value={roomFilters.type}
                  onChange={(e) => setRoomFilters({...roomFilters, type: e.target.value})}
                  className="w-full px-3 py-2 border border-ids-border rounded text-xs focus:outline-none focus:border-ids-sidebar"
                >
                  <option value="">All Types</option>
                  {uniqueRoomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Room Status
                </label>
                <select
                  value={roomFilters.status}
                  onChange={(e) => setRoomFilters({...roomFilters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-ids-border rounded text-xs focus:outline-none focus:border-ids-sidebar"
                >
                  <option value="">All Status</option>
                  <option value="vacant_clean">Ready</option>
                  <option value="dirty">Dirty</option>
                  <option value="occupied">Occupied</option>
                  <option value="reservation">Reserved</option>
                  <option value="out_of_service">Out of Service</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                  &nbsp;
                </label>
                <label className="flex items-center gap-2 px-3 py-2 border border-ids-border rounded text-xs cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={roomFilters.availableOnly}
                    onChange={(e) => setRoomFilters({...roomFilters, availableOnly: e.target.checked})}
                    className="rounded"
                  />
                  <span>Available Only</span>
                </label>
              </div>
            </div>

            <button
              onClick={() => setRoomFilters({ floor: "", type: "", status: "", availableOnly: false })}
              className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>

            {/* Room Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredRooms.map((room) => {
                  const available = isRoomAvailable(room);
                  const isHighlighted = room.type_code === selectedReservation?.room_type;
                  
                  return (
                    <div
                      key={room.room_no}
                      className={`
                        border border-ids-border rounded p-3 shadow-3xs transition-shadow
                        ${available ? 'hover:shadow-sm cursor-pointer' : 'opacity-50'}
                        ${isHighlighted ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-black text-lg text-ids-sidebar">
                          {room.room_no}
                        </span>
                        {getRoomStatusBadge(room.status)}
                      </div>
                      
                      <div className="text-xs space-y-1 text-gray-600 mb-3">
                        <p><span className="font-semibold">Type:</span> {room.type_code}</p>
                        <p><span className="font-semibold">Floor:</span> {room.floor}</p>
                        {room.guest_name && (
                          <p><span className="font-semibold">Guest:</span> {room.guest_name}</p>
                        )}
                        {room.reservation_no && (
                          <p className="font-mono"><span className="font-semibold">Res:</span> {room.reservation_no}</p>
                        )}
                      </div>
                      
                      {available && (
                        <button
                          onClick={() => handleAssignRoom(room.room_no)}
                          className="w-full py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Bed className="w-4 h-4" />
                          Assign Room
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Floor View
              <div className="space-y-6">
                {roomsByFloor.map(([floor, roomsOnFloor]) => (
                  <div key={floor}>
                    <h3 className="text-sm font-black uppercase tracking-wider mb-3 text-ids-sidebar">
                      Floor {floor}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {roomsOnFloor.map((room) => {
                        const available = isRoomAvailable(room);
                        const isHighlighted = room.type_code === selectedReservation?.room_type;
                        
                        return (
                          <div
                            key={room.room_no}
                            className={`
                              border border-ids-border rounded p-3 shadow-3xs transition-shadow
                              ${available ? 'hover:shadow-sm cursor-pointer' : 'opacity-50'}
                              ${isHighlighted ? 'ring-2 ring-blue-500' : ''}
                            `}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-mono font-black text-lg text-ids-sidebar">
                                {room.room_no}
                              </span>
                              {getRoomStatusBadge(room.status)}
                            </div>
                            
                            <div className="text-xs space-y-1 text-gray-600 mb-3">
                              <p><span className="font-semibold">Type:</span> {room.type_code}</p>
                              {room.guest_name && (
                                <p><span className="font-semibold">Guest:</span> {room.guest_name}</p>
                              )}
                              {room.reservation_no && (
                                <p className="font-mono"><span className="font-semibold">Res:</span> {room.reservation_no}</p>
                              )}
                            </div>
                            
                            {available && (
                              <button
                                onClick={() => handleAssignRoom(room.room_no)}
                                className="w-full py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <Bed className="w-4 h-4" />
                                Assign Room
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Modal isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6">
          <h2 className="text-lg font-black text-ids-sidebar uppercase tracking-wider mb-4">
            Confirm Room Assignment
          </h2>
          
          <div className="space-y-2 mb-6 text-sm">
            <p>
              <span className="text-gray-400">Guest:</span>{" "}
              <span className="font-semibold">{selectedReservation?.guest_name}</span>
            </p>
            <p>
              <span className="text-gray-400">Reservation:</span>{" "}
              <span className="font-mono font-bold">{selectedReservation?.reservation_no}</span>
            </p>
            
            {currentRoom && (
              <p>
                <span className="text-gray-400">Current Room:</span>{" "}
                <span className="font-mono">{currentRoom}</span>
              </p>
            )}
            
            <p>
              <span className="text-gray-400">New Room:</span>{" "}
              <span className="font-mono font-bold text-green-600">{selectedRoomNo}</span>
            </p>
            <p>
              <span className="text-gray-400">Room Type:</span>{" "}
              {selectedRoom?.type_code}
            </p>
            <p>
              <span className="text-gray-400">Stay:</span>{" "}
              {formatDate(selectedReservation?.arrival)} - {formatDate(selectedReservation?.departure)}
            </p>
            
            {compatibility.mismatch && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-3">
                <p className="text-yellow-800 text-xs mb-2">
                  {compatibility.message}
                </p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={confirmMismatch}
                    onChange={(e) => setConfirmMismatch(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">I confirm this room type change is authorized</span>
                </label>
              </div>
            )}
            
            {isDirtyRoom && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-3">
                <p className="text-yellow-800 text-xs">
                  ⚠️ Room needs cleaning - proceed anyway?
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={confirmAssignment}
              disabled={compatibility.mismatch && !confirmMismatch}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Confirm Assignment
            </button>
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
