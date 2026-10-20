import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReservations } from "../hooks/useReservations.js";
import { useHotelStore, getAssignedRoom } from "../store/useHotelStore.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Badge from "../components/ui/Badge.jsx";
import { formatDateDisplay } from "../utils/dateUtils.js";
import { formatCurrency } from "../utils/formatters.js";
import { LogIn, Calendar, Search, Users, Sparkles } from "lucide-react";
import EmptyState from "../components/ui/EmptyState.jsx";
import toast from "react-hot-toast";
import { RequirePermission } from "../components/auth/RequirePermission.jsx";
import { PERMISSIONS } from "../config/rbac.js";

export const CheckIn = () => {
  const navigate = useNavigate();
  const { reservations, checkInGuest } = useReservations();
  const { rooms, getAvailableRooms } = useHotelStore();
  const [searchQuery, setSearchQuery] = useState("");

  const today = useHotelStore((state) => state.selectedDate);

  // Filter expected arrivals for today
  const arrivals = reservations.filter(
    (res) => res.arrival === today && res.status === "confirmed"
  );

  const filteredArrivals = arrivals.filter((res) =>
    res.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.reservation_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickCheckIn = (resNo, roomTypeCode) => {
    // 1. Find the full reservation object so we can call getAssignedRoom
    const reservation = reservations.find((r) => r.reservation_no === resNo);

    // 2. Prefer the explicitly assigned room (via Assign Room page)
    const preAssigned = getAssignedRoom(reservation, rooms);

    if (preAssigned) {
      // Use the exact room that was assigned — no fallback needed
      checkInGuest(resNo, preAssigned);
      toast.success(`Checked in ${resNo} → Room ${preAssigned} ✓`);
      return;
    }

    // 3. No room assigned yet — fall back to first vacant clean room of matching type
    const available = getAvailableRooms(today, today, roomTypeCode);
    if (available.length === 0) {
      toast.error(`No vacant clean rooms of type ${roomTypeCode} available. Please assign a room first.`);
      navigate(`/app/reservations/assign?id=${resNo}`);
      return;
    }

    const fallbackRoom = available[0].room_no;
    checkInGuest(resNo, fallbackRoom);
    toast.success(`Checked in ${resNo} → Room ${fallbackRoom} (auto-assigned) ✓`);
  };

  return (
    <PageWrapper
      title="Front Desk Expected Arrivals"
      subtitle="Verify scheduled arrivals, assign available room configurations, and execute guest check-ins"
    >
      {/* Arrivals Controls */}
      <div id="check-in-controls" className="bg-white border border-ids-border p-4 rounded shadow-3xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            id="arrivals-search"
            type="text"
            placeholder="Search arrivals by guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-xs"
          />
        </div>

        <div className="text-[11px] font-bold text-gray-500 font-mono text-right">
          Total scheduled arrivals for today ({today}): <span className="text-orange-600 text-sm font-bold">{arrivals.length}</span>
        </div>
      </div>

      {/* Arrivals Table */}
      <div id="arrivals-table-wrapper" className="bg-white border border-ids-border rounded overflow-hidden shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse select-none text-xs">
          <thead className="bg-ids-sidebar text-white font-bold border-b border-ids-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Res No.</th>
              <th className="px-4 py-3 font-semibold">Guest Name</th>
              <th className="px-4 py-3 font-semibold">Room Type</th>
              <th className="px-4 py-3 font-semibold">Check Out Date</th>
              <th className="px-4 py-3 font-semibold">Billing Plan</th>
              <th className="px-4 py-3 font-semibold text-center">Auto-Assign Status</th>
              <th className="px-4 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ids-border">
            {filteredArrivals.length > 0 ? (
              filteredArrivals.map((res) => {
                const available = getAvailableRooms(today, res.departure, res.room_type);
                return (
                  <tr
                    key={res.reservation_no}
                    id={`arrival-row-${res.reservation_no}`}
                    onClick={() => navigate(`/reservations/${res.reservation_no}`)}
                    className="hover:bg-ids-bg/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-ids-header">
                      {res.reservation_no}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700">
                      {res.guest_name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-500">
                      {res.room_type}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">
                      {formatDateDisplay(res.departure)} ({res.nights} Nights)
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-semibold">
                      {res.pay_mode}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {available.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-[10px] font-bold text-green-700 border border-green-200">
                          {available.length} vacant rooms
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-[10px] font-bold text-red-700 border border-red-200">
                          No vacant clean
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-2">
                        <RequirePermission permission={PERMISSIONS.CHECKIN_PERFORM}>
                          <button
                            id={`btn-quick-checkin-${res.reservation_no}`}
                            onClick={() => handleQuickCheckIn(res.reservation_no, res.room_type)}
                            className="px-3 py-1 bg-room-vacant hover:bg-green-600 text-white font-bold text-[10px] rounded flex items-center space-x-1 shadow-2xs"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Quick Check-In</span>
                          </button>
                        </RequirePermission>
                        <button
                          id={`btn-open-folio-${res.reservation_no}`}
                          onClick={() => navigate(`/reservations/${res.reservation_no}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-gray-600 font-bold text-[10px] rounded border border-slate-300"
                        >
                          Manual assign
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8">
                  <EmptyState
                    title="No expected arrivals today"
                    description="There are no confirmed reservations scheduled for arrival on today's hotel date."
                    icon={Calendar}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default CheckIn;
