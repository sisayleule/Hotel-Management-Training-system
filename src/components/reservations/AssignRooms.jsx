import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHotelStore } from "../../store/useHotelStore.js";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { ArrowLeft, Save, XCircle, AlertTriangle, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export const AssignRooms = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const reservations = useHotelStore((state) => state.reservations);
  const rooms = useHotelStore((state) => state.rooms);
  const assignRoomToReservation = useHotelStore((state) => state.assignRoomToReservation);
  const releaseRoomFromReservation = useHotelStore((state) => state.releaseRoomFromReservation);

  const reservation = useMemo(() => {
    return reservations.find((r) => r.reservation_no === id);
  }, [reservations, id]);

  const resvNo = reservation?.reservation_no || id || "RES001";
  const guestName = reservation?.guest_name || "Guest";
  const roomType = reservation?.room_type || "DLX";
  const arrivalStr = reservation?.arrival || "2026-06-30";
  const departureStr = reservation?.departure || "2026-07-02";
  const assignedRooms = reservation?.rooms_assigned || [];

  const [selectedFloor, setSelectedFloor] = useState("All");
  const [confirmDialog, setConfirmDialog] = useState(null);

  const calendarDates = useMemo(() => {
    const start = parseISO(arrivalStr);
    const dates = [];
    for (let i = 0; i < 15; i++) {
      dates.push(addDays(start, i));
    }
    return dates;
  }, [arrivalStr]);

  const floors = useMemo(() => {
    const flrs = new Set(["All"]);
    rooms.forEach((r) => {
      if (r.floor) flrs.add(String(r.floor));
    });
    return Array.from(flrs);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchType = r.type_code === roomType;
      const matchFloor = selectedFloor === "All" || String(r.floor) === selectedFloor;
      return matchType && matchFloor;
    });
  }, [rooms, roomType, selectedFloor]);

  const getCellStatusClass = (room, date) => {
    const dateFormatted = format(date, "yyyy-MM-dd");
    
    if (assignedRooms.includes(room.room_no) && dateFormatted >= arrivalStr && dateFormatted < departureStr) {
      return "bg-teal-500 text-white border-teal-600";
    }
    
    if (room.status === "out_of_order") {
      return "bg-blue-500 text-white border-blue-600";
    }
    
    if (room.status === "occupied") {
      return "bg-red-500 text-white border-red-600";
    }
    
    if (room.status === "dirty") {
      return "bg-yellow-400 text-yellow-950 border-yellow-500";
    }
    
    return "bg-white text-gray-700 hover:bg-green-100 border-gray-200";
  };

  const handleCellClick = (room) => {
    const isRoomAssigned = assignedRooms.includes(room.room_no);

    if (isRoomAssigned) {
      setConfirmDialog({
        type: "release",
        roomNo: room.room_no,
        message: `Release Room ${room.room_no} from ${guestName}?`
      });
    } else {
      setConfirmDialog({
        type: "assign",
        roomNo: room.room_no,
        message: `Assign Room ${room.room_no} to ${guestName}?`
      });
    }
  };

  const handleConfirmAction = () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === "assign") {
      assignRoomToReservation(resvNo, confirmDialog.roomNo);
      toast.success(`Room ${confirmDialog.roomNo} assigned ✓`);
    } else {
      releaseRoomFromReservation(resvNo, confirmDialog.roomNo);
      toast.success(`Room ${confirmDialog.roomNo} released`);
    }

    setConfirmDialog(null);
  };

  const handleSaveExit = () => {
    toast.success("Room assignment saved");
    navigate(`/app/reservations`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-4 md:p-6 flex flex-col">
      
      {/* Header */}
      <div className="bg-white border border-ids-border rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <button
            onClick={() => navigate(`/app/reservations`)}
            className="p-1.5 hover:bg-gray-100 rounded-full shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase">Assign Room</span>
              <span className="px-1.5 py-0.5 bg-ids-sidebar text-white text-[8px] font-black rounded uppercase">V6.5</span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-ids-sidebar truncate">
              {resvNo} — {guestName}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-gray-50 p-2 rounded border border-gray-200">
          <div>
            <span className="text-[8px] text-gray-400 uppercase block">Type</span>
            <span className="text-[10px] sm:text-xs text-ids-sidebar font-bold">{roomType}</span>
          </div>
          <div>
            <span className="text-[8px] text-gray-400 uppercase block">Check-in</span>
            <span className="text-[10px] sm:text-xs text-green-700 font-bold">{format(parseISO(arrivalStr), "dd-MMM")}</span>
          </div>
          <div>
            <span className="text-[8px] text-gray-400 uppercase block">Check-out</span>
            <span className="text-[10px] sm:text-xs text-red-700 font-bold">{format(parseISO(departureStr), "dd-MMM")}</span>
          </div>
          <div>
            <span className="text-[8px] text-gray-400 uppercase block">Nights</span>
            <span className="text-[10px] sm:text-xs text-indigo-700 font-bold">{differenceInDays(parseISO(departureStr), parseISO(arrivalStr))}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-ids-border rounded-lg p-2 sm:p-3 mb-3 flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-500 uppercase text-[9px]">Floor:</span>
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="bg-gray-50 border border-ids-border rounded px-2 py-1 text-[10px] sm:text-xs font-bold"
          >
            {floors.map((flr) => (
              <option key={flr} value={flr}>{flr === "All" ? "All Floors" : `Floor ${flr}`}</option>
            ))}
          </select>
        </div>
        
        {assignedRooms.length > 0 && (
          <div className="text-[10px] sm:text-xs font-bold text-green-700">
            ✓ {assignedRooms.length} Room{assignedRooms.length > 1 ? 's' : ''} Assigned: {assignedRooms.join(", ")}
          </div>
        )}
      </div>

      {/* Room Grid */}
      <div className="flex-1 bg-white border border-ids-border rounded-lg overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-100 px-2 sm:px-3 py-2 text-left text-[9px] sm:text-xs font-black text-ids-sidebar border-b border-r border-gray-300">
                  Room
                </th>
                {calendarDates.map((date, idx) => (
                  <th
                    key={idx}
                    className="py-1.5 sm:py-2 text-center text-[8px] sm:text-[9px] font-mono font-bold text-gray-500 border-b border-gray-300 min-w-[28px] sm:min-w-[36px]"
                  >
                    <div className="text-[7px] sm:text-[8px] uppercase">{format(date, "EEE")}</div>
                    <div className="text-[9px] sm:text-xs font-black">{format(date, "d")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room.room_no} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-black text-ids-sidebar border-r border-gray-200">
                    <div className="flex items-center justify-between">
                      <span>{room.room_no}</span>
                      {assignedRooms.includes(room.room_no) && (
                        <span className="text-green-600 text-xs ml-1">✓</span>
                      )}
                    </div>
                  </td>
                  {calendarDates.map((date, dIdx) => {
                    const statusClass = getCellStatusClass(room, date);
                    const isInRange = format(date, "yyyy-MM-dd") >= arrivalStr && format(date, "yyyy-MM-dd") < departureStr;
                    return (
                      <td
                        key={dIdx}
                        onClick={() => isInRange && handleCellClick(room)}
                        className={`p-0.5 sm:p-1 border border-gray-200 ${isInRange ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed'} ${statusClass}`}
                      >
                        <div className="h-4 sm:h-6 w-full flex items-center justify-center text-[8px] sm:text-[10px]">
                          {assignedRooms.includes(room.room_no) && isInRange ? "✔" : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {filteredRooms.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-400 font-bold text-xs">
                    No rooms available for this room type
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 border-t border-gray-300 p-2 flex flex-wrap gap-2 sm:gap-4 justify-center text-[8px] sm:text-[10px] font-bold uppercase text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white border border-gray-300"></div>
            <span>Vacant</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-teal-500"></div>
            <span>Assigned</span>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-lg p-4 shadow-2xl">
            <AlertTriangle className="w-8 h-8 text-ids-header mx-auto mb-3" />
            <h4 className="text-sm font-black text-ids-sidebar uppercase text-center mb-2">
              Confirm Action
            </h4>
            <p className="text-gray-600 font-semibold text-center mb-4 text-xs">
              {confirmDialog.message}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmAction}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold uppercase rounded text-xs"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="bg-white border border-ids-border rounded-lg p-2 sm:p-3 mt-3 flex justify-between items-center gap-2">
        <div className="text-[8px] sm:text-[10px] font-bold text-gray-400">
          <span className="hidden sm:inline">* Click "Save" to keep changes</span>
          <span className="sm:hidden">* Save changes</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/app/reservations`)}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded text-[10px] sm:text-xs flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSaveExit}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-[10px] sm:text-xs flex items-center gap-1"
          >
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default AssignRooms;
