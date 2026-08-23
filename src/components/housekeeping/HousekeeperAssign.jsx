import React, { useState } from "react";
import { Users, ChevronDown, ChevronUp, UserCheck, Shield, Calendar, RefreshCw } from "lucide-react";
import { useHotelStore } from "../../store/useHotelStore.js";
import toast from "react-hot-toast";

export const HousekeeperAssign = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { rooms, housekeeperStaff, assignHousekeeperToRoom } = useHotelStore();
  const [selectedRoom, setSelectedRoom] = useState("");

  // Filter dirty rooms for easy assignment dropdown
  const dirtyRooms = rooms.filter((r) => r.status === "dirty");

  const handleAssignSubmit = (staffId) => {
    if (!selectedRoom) {
      toast.error("Please select a room to assign first.");
      return;
    }
    assignHousekeeperToRoom(selectedRoom, staffId);
    const staffName = housekeeperStaff.find(s => s.id === staffId)?.name;
    toast.success(`Assigned Room ${selectedRoom} to ${staffName}!`);
    setSelectedRoom("");
  };

  return (
    <div className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden select-none font-sans text-xs">
      {/* Panel Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-50 border-b border-ids-border px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Users className="w-4.5 h-4.5 text-ids-sidebar" />
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Assign Rooms to Housekeeping Staff
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold uppercase">
            {housekeeperStaff.length} ACTIVE STAFF
          </span>
          {isOpen ? <ChevronUp className="w-4.5 h-4.5 text-gray-500" /> : <ChevronDown className="w-4.5 h-4.5 text-gray-500" />}
        </div>
      </div>

      {/* Panel Body */}
      {isOpen && (
        <div className="p-4 space-y-4 animate-scale-in">
          
          {/* Room Selector Trigger */}
          <div className="bg-amber-50/50 border border-amber-200 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-amber-800 text-xs">Quick Assignment Workflow</p>
              <p className="text-[10px] text-amber-600">Select a vacant or dirty room, then click "Assign to Staff" below.</p>
            </div>
            
            <div className="flex items-center space-x-2 shrink-0">
              <span className="font-bold text-gray-500">Room:</span>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="p-1.5 border border-amber-300 rounded font-mono font-bold text-xs bg-white focus:outline-none"
              >
                <option value="">-- Choose Room --</option>
                {rooms.map(r => (
                  <option key={r.room_no} value={r.room_no}>
                    Room {r.room_no} ({r.status.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff Grid/Table */}
          <div className="border border-ids-border/50 rounded overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-gray-700 font-bold border-b border-ids-border text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Housekeeper Staff</th>
                  <th className="px-4 py-2.5">Current Shift</th>
                  <th className="px-4 py-2.5">Assigned Keys</th>
                  <th className="px-4 py-2.5 text-center">Cleaned Today</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ids-border/40">
                {housekeeperStaff.map((staff) => {
                  // Count rooms currently assigned in state
                  const assignedKeys = rooms
                    .filter(r => r.housekeeper_id === staff.id)
                    .map(r => r.room_no);

                  return (
                    <tr key={staff.id} className="hover:bg-ids-bg/15 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-700 flex items-center space-x-1.5">
                        <div className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center font-black text-[10px]">
                          {staff.name.charAt(0)}
                        </div>
                        <span>{staff.name}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-500 font-mono">
                        {staff.shift}
                      </td>
                      <td className="px-4 py-3">
                        {assignedKeys.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedKeys.map((k) => (
                              <span key={k} className="bg-slate-100 text-slate-700 font-mono font-bold border border-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                                {k}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-normal italic">No assigned keys</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                        {staff.cleanedToday} Room(s)
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleAssignSubmit(staff.id)}
                          disabled={!selectedRoom}
                          className="px-2.5 py-1 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-bold text-[10px] rounded transition-all shadow-3xs disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Assign Room {selectedRoom || ""}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
};

export default HousekeeperAssign;
