import React, { useState } from "react";
import { X, Save, ShieldAlert, CheckCircle, Flame, Wrench, AlertCircle, Info, User, Lock } from "lucide-react";
import { useHotelStore } from "../../store/useHotelStore.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { PERMISSIONS } from "../../config/rbac.js";
import { useEnterAsTab } from "../../hooks/useEnterAsTab.js";
import { getRoomStatusColors, getStatusLabel } from "../../utils/roomUtils.js";
import toast from "react-hot-toast";

export const HouseKeepingCard = ({ roomNo, onClose }) => {
  const { rooms, housekeeperStaff, updateRoomHousekeeping, assignHousekeeperToRoom, addMaintenanceRequest } = useHotelStore();
  const { can } = usePermissions();

  // Only housekeeping role (and manager) may change room status / log maintenance
  const canUpdateHK = can(PERMISSIONS.HOUSEKEEPING_UPDATE_STATUS) || can("*");

  const roomObj = rooms.find((r) => r.room_no === roomNo);
  
  if (!roomObj) return null;

  // Local state initialized with room values
  const [note, setNote] = useState(roomObj.note || "");
  const [condition, setCondition] = useState(roomObj.condition || "Normal");
  const [housekeeperId, setHousekeeperId] = useState(roomObj.housekeeper_id || "");

  // Maintenance Category State
  const [maintCategory, setMaintCategory] = useState("Plumbing");
  const [maintDesc, setMaintDesc] = useState("");
  const [maintPriority, setMaintPriority] = useState("Medium");

  const maintFormRef = useEnterAsTab({ onSubmit: (e) => handleMaintenanceSubmit(e) });

  const clr = getRoomStatusColors(roomObj.status);

  // Handlers
  const handleSaveNote = () => {
    updateRoomHousekeeping(roomNo, { note });
    toast.success(`Notes saved for Room ${roomNo}`);
  };

  const handleConditionChange = (cond) => {
    if (!canUpdateHK) {
      toast.error("Only Housekeeping staff can change room condition.");
      return;
    }
    setCondition(cond);
    updateRoomHousekeeping(roomNo, { condition: cond });
    
    // Auto change status if Out of Order (OOO)
    if (cond === "Maintenance Required") {
      updateRoomHousekeeping(roomNo, { status: "out_of_order" });
      toast.success(`Room ${roomNo} condition set to Maintenance Required. Status changed to Out of Order.`);
    } else {
      toast.success(`Room ${roomNo} condition updated to ${cond}`);
    }
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    if (!canUpdateHK) {
      toast.error("Only Housekeeping staff can log maintenance requests.");
      return;
    }
    if (!maintDesc.trim()) {
      toast.error("Please specify a maintenance description.");
      return;
    }

    const req = {
      room_no: roomNo,
      category: maintCategory,
      description: maintDesc,
      priority: maintPriority,
      date: new Date().toLocaleDateString(),
      status: "Open"
    };

    addMaintenanceRequest(req);
    updateRoomHousekeeping(roomNo, { 
      status: "out_of_order", 
      condition: "Maintenance Required",
      note: `🔧 Maintenance (${maintCategory}): ${maintDesc}`
    });

    toast.success(`Maintenance request logged! Room ${roomNo} marked as Out of Order.`);
    setMaintDesc("");
    onClose();
  };

  const handleQuickStatus = (newStatus) => {
    if (!canUpdateHK) {
      toast.error("Only Housekeeping staff can change room status.");
      return;
    }
    updateRoomHousekeeping(roomNo, { status: newStatus });
    toast.success(`Room ${roomNo} status changed to ${getStatusLabel(newStatus)}.`);
    onClose();
  };

  const handleAssignHousekeeper = () => {
    assignHousekeeperToRoom(roomNo, housekeeperId);
    const hkName = housekeeperStaff.find(h => h.id === housekeeperId)?.name || "Unassigned";
    toast.success(`Assigned Room ${roomNo} to housekeeper: ${hkName}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in font-sans select-none">
      <div className="bg-white border border-ids-border rounded-lg shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider">
              Room Details & Hygiene — {roomNo}
            </h3>
            <p className="text-[10px] text-slate-300 font-medium">
              PMS Service Registry Card
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-gray-700">
          
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100">
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400">Room Category</p>
              <p className="font-bold text-gray-800">{roomObj.type_name} ({roomObj.type_code})</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-gray-400">Housekeeping Status</p>
              <span className={`inline-block px-2 py-0.5 mt-0.5 rounded font-black text-[9px] border ${clr.lightBg} ${clr.lightText} ${clr.border}`}>
                {getStatusLabel(roomObj.status).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Extended Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] bg-gray-50 border border-ids-border/30 rounded p-2.5">
            <div><span className="text-gray-400 font-bold uppercase">Floor:</span> <span className="font-mono font-bold text-gray-700">{roomObj.floor}th Floor</span></div>
            <div><span className="text-gray-400 font-bold uppercase">Wing Block:</span> <span className="font-mono font-bold text-gray-700">{roomObj.block || "BA-FF02"}</span></div>
            <div><span className="text-gray-400 font-bold uppercase">Max Adults:</span> <span className="font-mono font-bold text-gray-700">{roomObj.max_adults || 3}</span></div>
            <div><span className="text-gray-400 font-bold uppercase">Max Kids:</span> <span className="font-mono font-bold text-gray-700">{roomObj.max_children || 2}</span></div>
            <div><span className="text-gray-400 font-bold uppercase">Smoking Allowed:</span> <span className="font-bold text-gray-700">{roomObj.is_smoking ? "🚬 YES" : "🚭 NO"}</span></div>
            <div><span className="text-gray-400 font-bold uppercase">Last Cleaned:</span> <span className="font-mono font-bold text-gray-700">Today, 11:30 AM</span></div>
          </div>

          {/* Guest Occupancy (If Occupied) */}
          {roomObj.status === "occupied" && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-[11px] space-y-1 text-red-900">
              <div className="flex items-center gap-1 font-black uppercase text-[9px] text-red-700">
                <User className="w-3.5 h-3.5" />
                <span>Active Occupancy Details</span>
              </div>
              <p><span className="font-bold">Guest Name:</span> {roomObj.guest_name}</p>
              <p><span className="font-bold">Reservation No:</span> {roomObj.reservation_no}</p>
              <p className="text-[10px] text-red-700 italic">⚠️ DND Check: Do not disturb unless specifically requested.</p>
            </div>
          )}

          {/* Housekeeping Notes */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">Housekeeper Notes</label>
            <div className="flex gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter room comments, e.g. 'extra towels requested', 'mini bar replenished'..."
                className="flex-1 p-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header text-xs bg-white text-gray-800"
                rows={2}
              />
              <button
                type="button"
                onClick={handleSaveNote}
                className="bg-slate-800 hover:bg-slate-950 text-white p-2.5 rounded transition-all flex items-center justify-center shrink-0 self-end"
                title="Save Notes"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Room condition */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">Room Physical Condition</label>
            {canUpdateHK ? (
              <div className="flex gap-4">
                {["Normal", "Needs Attention", "Maintenance Required"].map((cond) => (
                  <label key={cond} className="flex items-center space-x-1.5 cursor-pointer font-bold text-gray-600 text-[11px]">
                    <input
                      type="radio"
                      name="room_condition"
                      checked={condition === cond}
                      onChange={() => handleConditionChange(cond)}
                      className="accent-slate-800"
                    />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded border border-orange-200 bg-orange-50 text-[11px] text-orange-700 font-bold">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Condition changes are restricted to Housekeeping staff.</span>
              </div>
            )}
          </div>

          {/* If Maintenance Required, Show Logging Form — housekeeping only */}
          {condition === "Maintenance Required" && (
            canUpdateHK ? (
            <form ref={maintFormRef} onSubmit={handleMaintenanceSubmit} className="border border-amber-200 bg-amber-50/50 rounded p-3 space-y-3.5 animate-scale-in">
              <div className="flex items-center gap-1 font-black uppercase text-[9px] text-amber-700">
                <Wrench className="w-3.5 h-3.5" />
                <span>Log Maintenance Request</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Issue Category *</label>
                  <select
                    value={maintCategory}
                    onChange={(e) => setMaintCategory(e.target.value)}
                    className="w-full p-1.5 border border-amber-300 rounded text-xs focus:outline-none bg-white font-bold"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Furniture">Furniture</option>
                    <option value="AC / Heating">AC / Heating</option>
                    <option value="Smart Locks">Smart Locks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Priority Priority *</label>
                  <div className="flex gap-2">
                    {["Low", "Medium", "High"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setMaintPriority(p)}
                        className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                          maintPriority === p
                            ? p === "High"
                              ? "bg-red-500 text-white border-red-600"
                              : p === "Medium"
                              ? "bg-amber-500 text-white border-amber-600"
                              : "bg-green-500 text-white border-green-600"
                            : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Description *</label>
                <input
                  type="text"
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  placeholder="e.g. 'faucet leaking', 'door handle loose'..."
                  className="w-full p-1.5 border border-amber-300 rounded text-xs focus:outline-none bg-white text-gray-800"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition-all shadow-2xs flex items-center justify-center space-x-1"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Submit to Maintenance Logs</span>
              </button>
            </form>
            ) : null
          )}

          {/* Quick Status Buttons — housekeeping only */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">Fast State Transitions</label>
            {canUpdateHK ? (
              <div className="grid grid-cols-2 gap-2">
                {roomObj.status === "dirty" && (
                  <>
                    <button
                      onClick={() => handleQuickStatus("vacant_clean")}
                      className="py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-3xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Release Vacant Clean</span>
                    </button>
                    <button
                      onClick={() => handleQuickStatus("out_of_order")}
                      className="py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-3xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Mark Out of Order</span>
                    </button>
                  </>
                )}

                {roomObj.status === "vacant_clean" && (
                  <>
                    <button
                      onClick={() => handleQuickStatus("dirty")}
                      className="py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded shadow-3xs flex items-center justify-center space-x-1 transition-all animate-pulse"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Report Vacant Dirty</span>
                    </button>
                    <button
                      onClick={() => handleQuickStatus("out_of_order")}
                      className="py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-3xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Mark Out of Order</span>
                    </button>
                  </>
                )}

                {roomObj.status === "out_of_order" && (
                  <button
                    onClick={() => {
                      handleQuickStatus("vacant_clean");
                      updateRoomHousekeeping(roomNo, { condition: "Normal" });
                    }}
                    className="col-span-2 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-3xs flex items-center justify-center space-x-1 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Fix & Release Clean Ready</span>
                  </button>
                )}

                {roomObj.status === "occupied" && (
                  <button
                    onClick={() => {
                      handleQuickStatus("dirty");
                      toast.success("Guest checked out manually via Housekeeping Board");
                    }}
                    className="col-span-2 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow-3xs flex items-center justify-center space-x-1 transition-all"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Force Checkout & Mark Dirty</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded border border-orange-200 bg-orange-50 text-[11px] text-orange-700">
                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-black uppercase text-[9px] tracking-wide">Housekeeping Access Only</p>
                  <p className="mt-0.5 leading-snug">
                    Room status transitions (clean, dirty, out-of-order) are managed exclusively
                    by <strong>Housekeeping</strong> staff. Front Office may only check guests
                    out — the room is automatically set to <strong>Dirty</strong> on checkout.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Housekeeper Assignment */}
          <div className="space-y-1.5 pt-1.5 border-t border-gray-100">
            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">Assign Housekeeper Staff</label>
            <div className="flex gap-2">
              <select
                value={housekeeperId}
                onChange={(e) => setHousekeeperId(e.target.value)}
                className="flex-1 p-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header text-xs bg-white text-gray-800 font-bold"
              >
                <option value="">-- Select Cleaner Staff --</option>
                {housekeeperStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.shift})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssignHousekeeper}
                className="px-3.5 py-2 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-bold rounded transition-all text-xs"
              >
                Assign
              </button>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-gray-50 border-t border-ids-border/50 px-4 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-ids-border rounded font-bold text-xs text-slate-600 hover:bg-gray-100 transition-all bg-white"
          >
            Close Sheet
          </button>
        </div>

      </div>
    </div>
  );
};

export default HouseKeepingCard;
