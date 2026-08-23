import React, { useMemo } from "react";
import { useHotelStore } from "../store/useHotelStore.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { ReservationStatusBadge } from "../components/reservations/ReservationStatusBadge.jsx";
import {
  ClipboardList,
  UserCheck,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Clock,
  BedDouble,
  Users,
  DoorOpen,
  Sparkles
} from "lucide-react";

export const HousekeepingOperations = () => {
  const reservations = useHotelStore((state) => state.reservations);
  const rooms = useHotelStore((state) => state.rooms);
  const selectedDate = useHotelStore((state) => state.selectedDate);
  const roomTypes = useHotelStore((state) => state.roomTypes);

  // Filter arrivals for today
  const todayArrivals = useMemo(() => {
    return reservations.filter(
      (r) => r.arrival === selectedDate && r.status === "confirmed"
    );
  }, [reservations, selectedDate]);

  // Filter departures for today
  const todayDepartures = useMemo(() => {
    return reservations.filter(
      (r) => r.departure === selectedDate && r.status === "checked_in"
    );
  }, [reservations, selectedDate]);

  // Filter in-house guests
  const inhouseReservations = useMemo(() => {
    return reservations.filter((r) => r.status === "checked_in");
  }, [reservations]);

  // Daily Reservation Summary Statistics
  const stats = useMemo(() => {
    const totalArrivals = todayArrivals.length;
    const totalDepartures = todayDepartures.length;
    const totalInhouseGuests = inhouseReservations.reduce(
      (acc, r) => acc + (r.adults || 0) + (r.children || 0),
      0
    );
    const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
    const vacantCleanRooms = rooms.filter((r) => r.status === "vacant_clean").length;
    const dirtyRooms = rooms.filter((r) => r.status === "dirty").length;
    const readyForCheckIn = vacantCleanRooms;

    return {
      totalArrivals,
      totalDepartures,
      totalInhouseGuests,
      occupiedRooms,
      vacantCleanRooms,
      dirtyRooms,
      readyForCheckIn
    };
  }, [todayArrivals, todayDepartures, inhouseReservations, rooms]);

  // Room Type Lookup Helper
  const getRoomTypeName = (typeCode) => {
    const roomType = roomTypes.find((rt) => rt.type_code === typeCode);
    return roomType ? roomType.type_name : typeCode;
  };

  // Room Preparation Priorities
  const roomPriorities = useMemo(() => {
    const priorities = [];

    // 1. Rooms needed for today's arrivals
    const arrivalRooms = new Set();
    todayArrivals.forEach((res) => {
      if (res.rooms_assigned && res.rooms_assigned.length > 0) {
        res.rooms_assigned.forEach((roomNo) => arrivalRooms.add(roomNo));
      }
    });

    arrivalRooms.forEach((roomNo) => {
      const room = rooms.find((r) => r.room_no === roomNo);
      if (room) {
        priorities.push({
          roomNo: room.room_no,
          type: "arrival",
          priority: "High",
          status: room.status,
          detail: "Required for today's arrival",
          isVIP: room.type_code === "SUI" || room.type_code === "FAM"
        });
      }
    });

    // 2. VIP rooms that are dirty
    rooms.forEach((room) => {
      if (
        (room.type_code === "SUI" || room.type_code === "FAM") &&
        room.status === "dirty" &&
        !arrivalRooms.has(room.room_no)
      ) {
        priorities.push({
          roomNo: room.room_no,
          type: "vip",
          priority: "High",
          status: room.status,
          detail: "VIP room needs cleaning",
          isVIP: true
        });
      }
    });

    // 3. Rooms awaiting inspection (dirty rooms)
    rooms.forEach((room) => {
      if (
        room.status === "dirty" &&
        !arrivalRooms.has(room.room_no) &&
        room.type_code !== "SUI" &&
        room.type_code !== "FAM"
      ) {
        priorities.push({
          roomNo: room.room_no,
          type: "dirty",
          priority: "Medium",
          status: room.status,
          detail: room.housekeeper_id ? "Being cleaned" : "Awaiting cleaning",
          isVIP: false
        });
      }
    });

    // 4. Rooms marked out of service
    rooms.forEach((room) => {
      if (room.status === "out_of_service" || room.status === "out_of_order") {
        priorities.push({
          roomNo: room.room_no,
          type: "out_of_service",
          priority: "Urgent",
          status: room.status,
          detail: "Out of service - maintenance required",
          isVIP: false
        });
      }
    });

    return priorities;
  }, [todayArrivals, rooms, roomTypes]);

  return (
    <PageWrapper>
      <div className="text-xs font-sans text-gray-800 space-y-4" id="housekeeping-operations-page">
        
        {/* Top Header */}
        <div className="flex items-center justify-between bg-white border border-ids-border rounded-lg p-3.5 shadow-2xs select-none">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Housekeeping Module
            </span>
            <h1 className="text-lg font-black text-ids-sidebar tracking-tight">
              Today's Operations Dashboard
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
              Date: <span className="font-mono font-bold text-ids-sidebar">{selectedDate}</span>
            </p>
          </div>
          <div className="h-12 w-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* Daily Reservation Summary Statistics */}
        <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden">
          <div className="bg-gray-100 border-b border-ids-border px-4 py-2.5">
            <h2 className="text-[11px] font-black text-ids-sidebar uppercase tracking-wider">
              📊 Daily Reservation Summary
            </h2>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-1.5">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-900 font-mono">{stats.totalArrivals}</div>
              <div className="text-[9px] font-bold text-blue-700 uppercase tracking-wide mt-1">
                Arrivals Today
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-1.5">
                <LogOut className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-orange-900 font-mono">{stats.totalDepartures}</div>
              <div className="text-[9px] font-bold text-orange-700 uppercase tracking-wide mt-1">
                Departures Today
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-1.5">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-black text-green-900 font-mono">{stats.totalInhouseGuests}</div>
              <div className="text-[9px] font-bold text-green-700 uppercase tracking-wide mt-1">
                In-House Guests
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-1.5">
                <BedDouble className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-900 font-mono">{stats.occupiedRooms}</div>
              <div className="text-[9px] font-bold text-purple-700 uppercase tracking-wide mt-1">
                Occupied Rooms
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-1.5">
                <CheckCircle className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-teal-900 font-mono">{stats.vacantCleanRooms}</div>
              <div className="text-[9px] font-bold text-teal-700 uppercase tracking-wide mt-1">
                Vacant Clean
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-1.5">
                <Sparkles className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-900 font-mono">{stats.dirtyRooms}</div>
              <div className="text-[9px] font-bold text-red-700 uppercase tracking-wide mt-1">
                Need Cleaning
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-1.5">
                <DoorOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-900 font-mono">{stats.readyForCheckIn}</div>
              <div className="text-[9px] font-bold text-indigo-700 uppercase tracking-wide mt-1">
                Ready for Check-In
              </div>
            </div>
          </div>
        </div>

        {/* Expected Arrivals Table */}
        <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden">
          <div className="bg-gray-100 border-b border-ids-border px-4 py-2.5">
            <h2 className="text-[11px] font-black text-ids-sidebar uppercase tracking-wider">
              📥 Expected Arrivals Today
            </h2>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-ids-border">
                <tr>
                  <th className="px-4 py-3">Guest Name</th>
                  <th className="px-4 py-3 text-center">Arrival Time</th>
                  <th className="px-4 py-3 text-center">Room Type</th>
                  <th className="px-4 py-3 text-center">Assigned Room</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Special Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ids-border/30 text-[11px]">
                {todayArrivals.map((res, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={res.reservation_no}
                      className={`${isEven ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="px-4 py-2.5 font-extrabold text-ids-sidebar text-xs">
                        {res.guest_name}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-gray-600">
                        {res.arrival}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 uppercase font-bold">
                          {getRoomTypeName(res.room_type)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-black text-ids-header">
                        {res.rooms_assigned && res.rooms_assigned.length > 0
                          ? res.rooms_assigned.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <ReservationStatusBadge status={res.status} />
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 font-semibold">
                        {res.special_requests || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden p-3 space-y-2">
            {todayArrivals.map((res) => (
              <div
                key={res.reservation_no}
                className="bg-gray-50 border border-ids-border rounded-lg p-3 space-y-1.5"
              >
                <div className="font-extrabold text-ids-sidebar text-xs">{res.guest_name}</div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500 font-semibold">Arrival:</span>
                  <span className="font-mono font-bold text-gray-600">{res.arrival}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500 font-semibold">Room:</span>
                  <span className="font-mono font-black text-ids-header">
                    {res.rooms_assigned && res.rooms_assigned.length > 0
                      ? res.rooms_assigned.join(", ")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-gray-500 font-semibold">Status:</span>
                  <ReservationStatusBadge status={res.status} />
                </div>
              </div>
            ))}
          </div>

          {todayArrivals.length === 0 && (
            <div className="p-8 text-center text-gray-400 font-semibold text-[11px]">
              No arrivals expected today
            </div>
          )}
        </div>

        {/* Expected Departures Table */}
        <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden">
          <div className="bg-gray-100 border-b border-ids-border px-4 py-2.5">
            <h2 className="text-[11px] font-black text-ids-sidebar uppercase tracking-wider">
              📤 Expected Departures Today
            </h2>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-ids-border">
                <tr>
                  <th className="px-4 py-3">Guest Name</th>
                  <th className="px-4 py-3 text-center">Room Number</th>
                  <th className="px-4 py-3 text-center">Departure Time</th>
                  <th className="px-4 py-3 text-center">Checkout Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ids-border/30 text-[11px]">
                {todayDepartures.map((res, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={res.reservation_no}
                      className={`${isEven ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="px-4 py-2.5 font-extrabold text-ids-sidebar text-xs">
                        {res.guest_name}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-black text-ids-header">
                        {res.rooms_assigned && res.rooms_assigned.length > 0
                          ? res.rooms_assigned.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-gray-600">
                        {res.departure}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <ReservationStatusBadge status={res.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden p-3 space-y-2">
            {todayDepartures.map((res) => (
              <div
                key={res.reservation_no}
                className="bg-gray-50 border border-ids-border rounded-lg p-3 space-y-1.5"
              >
                <div className="font-extrabold text-ids-sidebar text-xs">{res.guest_name}</div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500 font-semibold">Room:</span>
                  <span className="font-mono font-black text-ids-header">
                    {res.rooms_assigned && res.rooms_assigned.length > 0
                      ? res.rooms_assigned.join(", ")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500 font-semibold">Departure:</span>
                  <span className="font-mono font-bold text-gray-600">{res.departure}</span>
                </div>
                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-gray-500 font-semibold">Status:</span>
                  <ReservationStatusBadge status={res.status} />
                </div>
              </div>
            ))}
          </div>

          {todayDepartures.length === 0 && (
            <div className="p-8 text-center text-gray-400 font-semibold text-[11px]">
              No departures expected today
            </div>
          )}
        </div>

        {/* Room Preparation Priorities */}
        <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden">
          <div className="bg-gray-100 border-b border-ids-border px-4 py-2.5">
            <h2 className="text-[11px] font-black text-ids-sidebar uppercase tracking-wider">
              🎯 Room Preparation Priorities
            </h2>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-ids-border">
                <tr>
                  <th className="px-4 py-3 text-center">Priority</th>
                  <th className="px-4 py-3 text-center">Room Number</th>
                  <th className="px-4 py-3 text-center">Current Status</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ids-border/30 text-[11px]">
                {roomPriorities.map((priority, idx) => {
                  const isEven = idx % 2 === 0;
                  const priorityColor =
                    priority.priority === "Urgent"
                      ? "bg-red-100 text-red-800 border-red-300"
                      : priority.priority === "High"
                      ? "bg-orange-100 text-orange-800 border-orange-300"
                      : "bg-yellow-100 text-yellow-800 border-yellow-300";

                  return (
                    <tr
                      key={`${priority.roomNo}-${idx}`}
                      className={`${isEven ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`px-2 py-1 rounded border font-bold uppercase text-[9px] ${priorityColor}`}
                        >
                          {priority.priority}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-black text-ids-header">
                        {priority.roomNo}
                        {priority.isVIP && (
                          <span className="ml-1 text-yellow-600 text-xs">★</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 uppercase font-bold text-[10px]">
                          {priority.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 font-semibold">
                        {priority.detail}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden p-3 space-y-2">
            {roomPriorities.map((priority, idx) => {
              const priorityColor =
                priority.priority === "Urgent"
                  ? "bg-red-100 text-red-800 border-red-300"
                  : priority.priority === "High"
                  ? "bg-orange-100 text-orange-800 border-orange-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300";

              return (
                <div
                  key={`${priority.roomNo}-${idx}`}
                  className="bg-gray-50 border border-ids-border rounded-lg p-3 space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-black text-ids-header">
                      Room {priority.roomNo}
                      {priority.isVIP && (
                        <span className="ml-1 text-yellow-600 text-xs">★</span>
                      )}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border font-bold uppercase text-[9px] ${priorityColor}`}
                    >
                      {priority.priority}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600 font-semibold">
                    {priority.detail}
                  </div>
                  <div className="text-[10px] text-gray-500 font-semibold">
                    Status: <span className="font-bold">{priority.status.replace("_", " ")}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {roomPriorities.length === 0 && (
            <div className="p-8 text-center text-gray-400 font-semibold text-[11px]">
              No priority rooms at this time
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  );
};

export default HousekeepingOperations;
