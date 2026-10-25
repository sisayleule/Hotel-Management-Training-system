import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useHotelStore } from "../store/useHotelStore.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { ReservationCard } from "../components/reservations/ReservationCard.jsx";
import { ReservationStatusBadge } from "../components/reservations/ReservationStatusBadge.jsx";
import { RequirePermission } from "../components/auth/RequirePermission.jsx";
import { PERMISSIONS } from "../config/rbac.js";
import {
  Plus,
  Search,
  Filter,
  X,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  CheckCircle,
  Slash
} from "lucide-react";
import { format, parseISO, isWithinInterval, isValid } from "date-fns";
import toast from "react-hot-toast";

export const Reservations = () => {
  const navigate = useNavigate();
  const reservations = useHotelStore((state) => state.reservations);
  const cancelReservation = useHotelStore((state) => state.cancelReservation);

  // States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("All");
  const [roomTypeFilter, setRoomTypeFilter] = useState("All");
  const [payModeFilter, setPayModeFilter] = useState("All");
  const [segmentFilter, setSegmentFilter] = useState("All");
  const [arrivalFrom, setArrivalFrom] = useState("");
  const [arrivalTo, setArrivalTo] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Sorting State
  const [sortField, setSortField] = useState("reservation_no");
  const [sortDirection, setSortDirection] = useState("desc");

  // Reset Filters
  const handleResetFilters = () => {
    setStatusFilter("All");
    setRoomTypeFilter("All");
    setPayModeFilter("All");
    setSegmentFilter("All");
    setArrivalFrom("");
    setArrivalTo("");
    setCurrentPage(1);
  };

  // Toggle Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered & Sorted Reservations
  const processedReservations = useMemo(() => {
    let result = [...reservations];

    // Exclude cancelled reservations from default view (unless explicitly filtered)
    if (statusFilter === "All") {
      result = result.filter((r) => r.status !== "cancelled");
    }

    // Real-time Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.reservation_no?.toLowerCase().includes(q) ||
          r.guest_name?.toLowerCase().includes(q) ||
          r.company_code?.toLowerCase().includes(q) ||
          r.room_type?.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== "All") {
      const normStatus = statusFilter.toLowerCase().replace(" ", "_");
      result = result.filter((r) => (r.status || "").toLowerCase() === normStatus);
    }

    // Room Type Filter
    if (roomTypeFilter !== "All") {
      result = result.filter((r) => r.room_type === roomTypeFilter);
    }

    // Pay Mode Filter
    if (payModeFilter !== "All") {
      result = result.filter((r) => (r.pay_mode || "").toLowerCase().includes(payModeFilter.toLowerCase()));
    }

    // Date Range Filter
    if (arrivalFrom || arrivalTo) {
      result = result.filter((r) => {
        try {
          const arrDate = parseISO(r.arrival);
          if (!isValid(arrDate)) return true;

          const start = arrivalFrom ? parseISO(arrivalFrom) : parseISO("2000-01-01");
          const end = arrivalTo ? parseISO(arrivalTo) : parseISO("2099-12-31");

          return arrDate >= start && arrDate <= end;
        } catch {
          return true;
        }
      });
    }

    // Sort Results
    result.sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [reservations, searchQuery, statusFilter, roomTypeFilter, payModeFilter, arrivalFrom, arrivalTo, sortField, sortDirection]);

  // Statistics Summary calculation
  const stats = useMemo(() => {
    const counts = { confirmed: 0, checked_in: 0, cancelled: 0, no_show: 0 };
    reservations.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "confirmed") counts.confirmed++;
      else if (s === "checked_in" || s === "checked-in") counts.checked_in++;
      else if (s === "cancelled") counts.cancelled++;
      else if (s === "no_show" || s === "no-show") counts.no_show++;
    });
    return counts;
  }, [reservations]);

  // Pagination Chunk
  const totalItems = processedReservations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return processedReservations.slice(startIdx, startIdx + itemsPerPage);
  }, [processedReservations, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  // Actions
  const handleCancelClick = useCallback((no) => {
    if (window.confirm(`Are you sure you want to cancel booking #${no}?`)) {
      cancelReservation(no, "Guest requested cancellation");
      toast.success(`Booking #${no} cancelled successfully`);
    }
  }, [cancelReservation]);

  const handleEditClick = useCallback((no) => {
    navigate(`/app/reservations/${no}`);
  }, [navigate]);

  return (
    <PageWrapper>
      <div className="text-xs font-sans text-gray-800 space-y-4" id="reservations-pms-page">
      
      {/* Top Action Header Bar */}
      <div className="flex items-center justify-between bg-white border border-ids-border rounded-lg p-3.5 shadow-2xs select-none">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Front Office Module</span>
          <h1 className="text-lg font-black text-ids-sidebar tracking-tight">Reservations Board</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-2 rounded border transition-all cursor-pointer ${
              searchOpen ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-ids-border text-gray-500 hover:bg-gray-50"
            }`}
            title="Expand Search Registry"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-ids-border rounded font-black uppercase text-[11px] flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>⚙ Filter</span>
          </button>
          <RequirePermission permission={PERMISSIONS.RESERVATIONS_CREATE}>
            <button
              id="new-booking-btn"
              onClick={() => navigate("/app/reservations/new")}
              className="px-4 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center space-x-1 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-yellow-400" />
              <span>+ New Booking</span>
            </button>
          </RequirePermission>
        </div>
      </div>

      {/* Expandable Real-Time Search Bar */}
      {searchOpen && (
        <div className="bg-white border border-ids-border rounded-lg p-3 flex items-center space-x-2 shadow-3xs animate-in fade-in slide-in-from-top-1">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            id="reservations-search-field"
            type="text"
            placeholder="Real-time filter by: reservation number, guest name, booker, company, room type..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-0 font-bold text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Summary Statistics Color Chips Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 select-none font-mono">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
            <span className="font-sans font-bold text-blue-900 uppercase text-[9px] tracking-wider">Confirmed</span>
          </div>
          <span className="text-base font-black text-blue-900">{stats.confirmed}</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>
            <span className="font-sans font-bold text-green-900 uppercase text-[9px] tracking-wider">Checked-in</span>
          </div>
          <span className="text-base font-black text-green-900">{stats.checked_in}</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>
            <span className="font-sans font-bold text-red-900 uppercase text-[9px] tracking-wider">Cancelled</span>
          </div>
          <span className="text-base font-black text-red-900">{stats.cancelled}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
            <span className="font-sans font-bold text-amber-900 uppercase text-[9px] tracking-wider">No Show</span>
          </div>
          <span className="text-base font-black text-amber-900">{stats.no_show}</span>
        </div>
      </div>

      {/* Reservations Display Lists: Desktop Table / Mobile Cards */}
      <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden">
        
        {/* DESKTOP VIEW — FULL LIST GRID */}
        <div className="hidden md:block overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse select-none" id="reservations-table-desktop">
            <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-[9px] tracking-wider sticky top-0 border-b border-ids-border z-10">
              <tr>
                <th onClick={() => handleSort("reservation_no")} className="px-4 py-3 cursor-pointer hover:text-ids-sidebar">
                  Resv# {sortField === "reservation_no" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("guest_name")} className="px-4 py-3 cursor-pointer hover:text-ids-sidebar">
                  Guest Name
                </th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Rooms</th>
                <th className="px-4 py-3 text-center">Adults</th>
                <th className="px-4 py-3 text-center">Arrival</th>
                <th className="px-4 py-3 text-center">Departure</th>
                <th className="px-4 py-3 text-center">Nights</th>
                <th className="px-4 py-3">Pay Mode</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ids-border/30 text-[11px]">
              {paginatedList.map((res, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={res.reservation_no}
                    onClick={() => navigate(`/app/reservations/${res.reservation_no}`)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${isEven ? "bg-white" : "bg-gray-50/30"}`}
                  >
                    <td className="px-4 py-2.5 font-mono font-black text-ids-header">
                      {res.reservation_no}
                    </td>
                    <td className="px-4 py-2.5 font-extrabold text-ids-sidebar text-xs">
                      {res.guest_name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 font-semibold truncate max-w-[120px]">
                      {res.company_code ? `${res.company_code} Ltd.` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 uppercase">
                        {res.room_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold text-gray-500">
                      {res.rooms_assigned?.length || 1}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold">
                      {res.adults || 1}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold text-gray-600">
                      {res.arrival}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold text-gray-600">
                      {res.departure}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-black text-indigo-700">
                      {res.nights || 1}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-600">
                      {res.pay_mode || "Cash"}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <ReservationStatusBadge status={res.status} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/app/reservations/${res.reservation_no}`)}
                          className="p-1 hover:bg-gray-100 rounded text-blue-600"
                          title="View detailed reservation card"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {res.status === "confirmed" && (
                          <>
                            <RequirePermission permission={PERMISSIONS.RESERVATIONS_EDIT}>
                              <button
                                onClick={() => navigate(`/app/reservations/assign?id=${res.reservation_no}`)}
                                className="p-1 hover:bg-gray-100 rounded text-green-600"
                                title="Assign Room"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            </RequirePermission>
                            <RequirePermission permission={PERMISSIONS.RESERVATIONS_CANCEL}>
                              <button
                                onClick={() => handleCancelClick(res.reservation_no)}
                                className="p-1 hover:bg-gray-100 rounded text-red-600"
                                title="Cancel reservation entry"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </RequirePermission>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW — MOBILE CARD LIST */}
        <div className="block md:hidden p-3.5 space-y-3">
          {paginatedList.map((res) => (
            <ReservationCard
              key={res.reservation_no}
              reservation={res}
              onCancel={handleCancelClick}
              onEdit={handleEditClick}
            />
          ))}
        </div>

        {/* Empty State Screen */}
        {totalItems === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3.5 select-none">
            <div className="h-12 w-12 bg-gray-100 border border-gray-200 text-gray-400 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-ids-sidebar uppercase tracking-wider">No matching bookings found</h3>
              <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Try adjusting your filters, clearing your query, or create a new booking</p>
            </div>
            <RequirePermission permission={PERMISSIONS.RESERVATIONS_CREATE}>
              <button
                onClick={() => navigate("/app/reservations/new")}
                className="px-4 py-1.5 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-bold uppercase rounded transition-colors"
              >
                + Create Booking
              </button>
            </RequirePermission>
          </div>
        )}

        {/* Pagination & Status Bottom Footer */}
        {totalItems > 0 && (
          <div className="bg-gray-50 border-t border-ids-border p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3.5 select-none font-sans text-[11px] font-bold text-gray-500">
            <div>
              Showing <span className="font-mono text-ids-sidebar font-black">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-mono text-ids-sidebar font-black">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-mono text-ids-sidebar font-black">{totalItems}</span> reservations
            </div>

            {/* Pagination buttons */}
            <div className="flex space-x-1 items-center">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1.5 bg-white border border-ids-border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isActive = p === currentPage;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`h-7 w-7 text-center rounded border font-mono font-black ${
                      isActive
                        ? "bg-ids-sidebar text-white border-ids-sidebar"
                        : "bg-white border-ids-border hover:bg-gray-100 text-gray-700 cursor-pointer"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1.5 bg-white border border-ids-border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Slide-out Filter Drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 select-none animate-fade-in">
          <div className="w-80 bg-white h-full p-5 flex flex-col justify-between shadow-2xl border-l border-ids-border">
            <div className="space-y-5 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-ids-border pb-3">
                <h3 className="text-xs font-black text-ids-sidebar uppercase tracking-wider">⚙ Filter Options</h3>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-900 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status badge</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-ids-border rounded px-2.5 py-1.5 font-bold text-ids-sidebar text-[11px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked-in">Checked-in</option>
                  <option value="Checked-out">Checked-out</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>

              {/* Room Type */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Room category type</label>
                <select
                  value={roomTypeFilter}
                  onChange={(e) => setRoomTypeFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-ids-border rounded px-2.5 py-1.5 font-bold text-ids-sidebar text-[11px]"
                >
                  <option value="All">All Categories</option>
                  <option value="STD">STD (Standard)</option>
                  <option value="SGL">SGL (Single)</option>
                  <option value="DLX">DLX (Deluxe)</option>
                  <option value="SUI">SUI (Suite)</option>
                  <option value="FAM">FAM (Family/VIP)</option>
                </select>
              </div>

              {/* Pay Mode */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Billing Pay Mode</label>
                <select
                  value={payModeFilter}
                  onChange={(e) => setPayModeFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-ids-border rounded px-2.5 py-1.5 font-bold text-ids-sidebar text-[11px]"
                >
                  <option value="All">All Payment Options</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Company">Bill To Company</option>
                </select>
              </div>

              {/* Date Interval Pickers */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Arrival Interval</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] uppercase text-gray-400 font-bold mb-1">From</label>
                    <input
                      type="date"
                      value={arrivalFrom}
                      onChange={(e) => setArrivalFrom(e.target.value)}
                      className="w-full bg-gray-50 border border-ids-border rounded px-1.5 py-1 font-bold text-[10px] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase text-gray-400 font-bold mb-1">To</label>
                    <input
                      type="date"
                      value={arrivalTo}
                      onChange={(e) => setArrivalTo(e.target.value)}
                      className="w-full bg-gray-50 border border-ids-border rounded px-1.5 py-1 font-bold text-[10px] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Apply reset actions */}
            <div className="border-t border-ids-border/50 pt-3.5 space-y-2 shrink-0">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setFilterDrawerOpen(false);
                  toast.success("Filters applied successfully!");
                }}
                className="w-full py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-black uppercase rounded tracking-wider transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold uppercase rounded tracking-wider transition-colors cursor-pointer"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </PageWrapper>
  );
};

export default Reservations;
