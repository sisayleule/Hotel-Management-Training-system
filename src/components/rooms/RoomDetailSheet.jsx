import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHotelStore } from "../../store/useHotelStore.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { PERMISSIONS } from "../../config/rbac.js";
import { BottomSheet } from "../ui/BottomSheet.jsx";
import toast from "react-hot-toast";
import {
  Bed,
  Wrench,
  AlertTriangle,
  Check,
  CreditCard,
  Trash2,
  Calendar,
  Building,
  User,
  Clock,
  PlusCircle,
  HelpCircle,
  FileText,
  SlidersHorizontal
} from "lucide-react";

/**
 * @typedef {Object} Room
 * @property {string} room_no
 * @property {string} type_code
 * @property {string} type_name
 * @property {number} floor
 * @property {string} block
 * @property {string} status
 * @property {string} guest_name
 * @property {string} [reservation_no]
 * @property {number} max_adults
 * @property {number} max_children
 * @property {boolean} is_smoking
 */

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function(): void} props.onClose
 * @param {Room} props.room
 */
export const RoomDetailSheet = ({ isOpen, onClose, room }) => {
  // ── All hooks at the top — no early returns before this block ─────────────
  const navigate = useNavigate();
  const updateRoomStatus = useHotelStore((state) => state.updateRoomStatus);
  const reservations = useHotelStore((state) => state.reservations);
  const currentUser = useHotelStore((state) => state.currentUser);
  const { can } = usePermissions();

  const [loadingAction, setLoadingAction] = useState(null);
  // ──────────────────────────────────────────────────────────────────────────

  if (!room) return null;

  // Permission gate: can this user manually change room status?
  const canChangeStatus =
    can(PERMISSIONS.ROOMS_CHANGE_STATUS) ||
    can(PERMISSIONS.HOUSEKEEPING_UPDATE_STATUS);

  // Find associated reservation if occupied or has active booking
  const reservation = reservations.find(
    (r) =>
      (room.reservation_no && r.reservation_no === room.reservation_no) ||
      (r.rooms_assigned && r.rooms_assigned.includes(room.room_no) && r.status === "checked_in")
  );

  const getStatusLabelAndColor = (status) => {
    switch (status) {
      case "vacant_clean":
        return { label: "VACANT CLEAN", color: "bg-green-500 text-white" };
      case "dirty":
      case "vacant_dirty":
        return { label: "VACANT DIRTY", color: "bg-orange-400 text-white" };
      case "occupied":
        return { label: "OCCUPIED", color: "bg-red-500 text-white" };
      case "out_of_order":
      case "not_available":
        return { label: "OUT OF ORDER", color: "bg-blue-500 text-white" };
      case "out_of_service":
      case "oos":
        return { label: "OUT OF SERVICE", color: "bg-purple-500 text-white" };
      case "reservation":
        return { label: "RESERVATION", color: "bg-yellow-400 text-gray-800" };
      case "departure":
        return { label: "DEPARTURE", color: "bg-gray-400 text-white" };
      default:
        return { label: "UNKNOWN", color: "bg-gray-200 text-gray-800" };
    }
  };

  const statusMeta = getStatusLabelAndColor(room.status);

  // Triggering the action workflow with 0.5s spinner
  const triggerAction = (actionName, newStatus, successMsg, customCallback = null) => {
    setLoadingAction(actionName);
    setTimeout(() => {
      setLoadingAction(null);
      if (customCallback) {
        customCallback();
      } else {
        updateRoomStatus(room.room_no, newStatus, room.guest_name, room.reservation_no);
        toast.success(successMsg, {
          duration: 3000,
          style: {
            background: "#22c55e",
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "12px",
            border: "none"
          },
        });
      }
      onClose();
    }, 500);
  };

  const isLd = (act) => loadingAction === act;
  const spinner = (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  );

  // Rendering the dynamic action buttons based on status and permissions.
  // Status-change buttons are only rendered when canChangeStatus is true.
  // Always-visible: Create Reservation, View Reservation, Check Out Guest,
  //                 Post Charge, Add Note.
  const renderActionButtons = () => {
    // Track whether any button was rendered for the "no actions" note
    let hasStatusButtons = false;
    let hasAlwaysButtons = false;

    const buttons = [];

    switch (room.status) {
      case "vacant_clean": {
        // Always visible
        hasAlwaysButtons = true;
        buttons.push(
          <button
            key="create_res"
            id="action-create-res"
            onClick={() =>
              triggerAction("create_res", null, "", () => {
                navigate(`/app/reservations/new?roomNo=${room.room_no}`);
              })
            }
            className="w-full h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
          >
            {isLd("create_res") ? spinner : <Bed className="w-5 h-5" />}
            <span>Create Reservation</span>
          </button>
        );

        if (canChangeStatus) {
          hasStatusButtons = true;
          buttons.push(
            <button
              key="mark_ooo"
              id="action-mark-ooo"
              onClick={() =>
                triggerAction("mark_ooo", "out_of_order", `Room ${room.room_no} marked as Out of Order ✓`)
              }
              className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {isLd("mark_ooo") ? spinner : <Wrench className="w-5 h-5" />}
              <span>Mark Out of Order</span>
            </button>,
            <button
              key="mark_dirty"
              id="action-mark-dirty-action"
              onClick={() =>
                triggerAction("mark_dirty", "dirty", `Room ${room.room_no} marked as Dirty ✓`)
              }
              className="w-full h-12 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {isLd("mark_dirty") ? spinner : <AlertTriangle className="w-5 h-5" />}
              <span>Mark Dirty</span>
            </button>
          );
        }
        break;
      }

      case "dirty":
      case "vacant_dirty": {
        // Always: Create Reservation
        hasAlwaysButtons = true;
        buttons.push(
          <button
            key="create_res"
            id="action-create-res"
            onClick={() =>
              triggerAction("create_res", null, "", () => {
                navigate(`/app/reservations/new?roomNo=${room.room_no}`);
              })
            }
            className="w-full h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
          >
            {isLd("create_res") ? spinner : <Bed className="w-5 h-5" />}
            <span>Create Reservation</span>
          </button>
        );

        if (canChangeStatus) {
          hasStatusButtons = true;
          buttons.unshift(
            // Mark Clean goes first
            <button
              key="mark_clean"
              id="action-mark-clean"
              onClick={() =>
                triggerAction("mark_clean", "vacant_clean", `Room ${room.room_no} marked as Clean ✓`)
              }
              className="w-full h-12 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {isLd("mark_clean") ? spinner : <Check className="w-5 h-5" />}
              <span>Mark Clean</span>
            </button>
          );
          buttons.push(
            <button
              key="mark_ooo"
              id="action-mark-ooo"
              onClick={() =>
                triggerAction("mark_ooo", "out_of_order", `Room ${room.room_no} marked as Out of Order ✓`)
              }
              className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {isLd("mark_ooo") ? spinner : <Wrench className="w-5 h-5" />}
              <span>Mark Out of Order</span>
            </button>
          );
        }
        break;
      }

      case "occupied": {
        // Always: Check Out Guest, Post Charge
        hasAlwaysButtons = true;
        buttons.push(
          <button
            key="checkout"
            id="action-checkout"
            onClick={() =>
              triggerAction("checkout", null, "", () => {
                if (room.reservation_no) {
                  navigate(`/app/checkout?id=${room.reservation_no}`);
                } else {
                  toast.error("No reservation linked to this room. Please locate the reservation manually in Check-Out.");
                  navigate("/app/checkout");
                }
              })
            }
            className="w-full h-12 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
          >
            {isLd("checkout") ? spinner : <Trash2 className="w-5 h-5" />}
            <span>Check Out Guest</span>
          </button>,
          <button
            key="post_charge"
            id="action-post-charge"
            onClick={() =>
              triggerAction("post_charge", null, "", () => {
                navigate(`/app/cashiering?roomNo=${room.room_no}`);
              })
            }
            className="w-full h-12 rounded-lg bg-ids-header hover:bg-ids-sidebar text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
          >
            {isLd("post_charge") ? spinner : <CreditCard className="w-5 h-5" />}
            <span>Post Charge</span>
          </button>
        );

        if (canChangeStatus) {
          hasStatusButtons = true;
          buttons.push(
            <button
              key="req_hk"
              id="action-request-hk"
              onClick={() =>
                triggerAction("req_hk", "dirty", `Housekeeping requested for Room ${room.room_no} ✓`)
              }
              className="w-full h-12 rounded-lg bg-orange-400 hover:bg-orange-500 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {isLd("req_hk") ? spinner : <Clock className="w-5 h-5" />}
              <span>Request Housekeeping</span>
            </button>
          );
        }
        break;
      }

      case "out_of_order":
      case "not_available": {
        // Always: Add Note
        hasAlwaysButtons = true;
        buttons.push(
          <button
            key="add_note"
            id="action-add-note"
            onClick={() => {
              toast.success("Maintenance note added!");
              onClose();
            }}
            className="w-full h-12 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
          >
            <FileText className="w-5 h-5" />
            <span>Add Note</span>
          </button>
        );

        if (canChangeStatus) {
          hasStatusButtons = true;
          buttons.unshift(
            <button
              key="mark_clean"
              id="action-mark-clean"
              onClick={() =>
                triggerAction("mark_clean", "vacant_clean", `Room ${room.room_no} marked as Available/Clean ✓`)
              }
              className="w-full h-12 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {isLd("mark_clean") ? spinner : <Check className="w-5 h-5" />}
              <span>Mark Available (Clean)</span>
            </button>
          );
        }
        break;
      }

      case "reservation": {
        // Always: Check In Guest, View Reservation
        hasAlwaysButtons = true;
        buttons.push(
          <button
            key="checkin"
            id="action-checkin"
            onClick={() =>
              triggerAction("checkin", null, "", () => {
                navigate(
                  room.reservation_no
                    ? `/app/checkin?id=${room.reservation_no}`
                    : "/app/checkin"
                );
              })
            }
            className="w-full h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
          >
            {isLd("checkin") ? spinner : <PlusCircle className="w-5 h-5" />}
            <span>Check In Guest</span>
          </button>,
          <button
            key="view_res"
            id="action-view-res"
            onClick={() =>
              triggerAction("view_res", null, "", () => {
                if (room.reservation_no) {
                  navigate(`/app/reservations/${room.reservation_no}`);
                } else {
                  navigate(`/app/reservations`);
                }
              })
            }
            className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
          >
            <FileText className="w-5 h-5" />
            <span>View Reservation</span>
          </button>
        );

        if (canChangeStatus) {
          hasStatusButtons = true;
          buttons.push(
            <button
              key="cancel_res"
              id="action-cancel-res"
              onClick={() =>
                triggerAction("cancel_res", "vacant_clean", `Reservation cancelled for Room ${room.room_no} ✓`)
              }
              className="w-full h-12 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {isLd("cancel_res") ? spinner : <Trash2 className="w-5 h-5" />}
              <span>Cancel Reservation</span>
            </button>
          );
        }
        break;
      }

      default: {
        if (canChangeStatus) {
          hasStatusButtons = true;
          buttons.push(
            <button
              key="reset"
              onClick={() =>
                triggerAction("mark_clean", "vacant_clean", `Room ${room.room_no} reset to clean ✓`)
              }
              className="w-full h-12 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              Reset to Available
            </button>
          );
        }
        break;
      }
    }

    // If no buttons at all, show the permission note
    if (!hasAlwaysButtons && !hasStatusButtons) {
      return (
        <p className="text-xs text-gray-400 font-medium text-center py-2">
          Only housekeeping can change this room's status.
        </p>
      );
    }

    // If we have always-buttons but no status-change buttons, add the note
    // so the user knows why status buttons are absent
    if (hasAlwaysButtons && !hasStatusButtons && !canChangeStatus) {
      buttons.push(
        <p key="no-status-note" className="text-xs text-gray-400 font-medium text-center py-1">
          Only housekeeping can change this room's status.
        </p>
      );
    }

    return buttons;
  };

  // Humanized dates for screenshot style display
  const todayFormatted = "30-JUN-2026";
  const checkoutFormatted = "02-JUL-2026";

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Room Unit ${room.room_no} Operations Panel`}
    >
      <div
        id={`room-detail-sheet-${room.room_no}`}
        className="space-y-5 text-xs font-sans text-gray-800"
      >
        {/* Header summary */}
        <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-ids-border rounded-lg shadow-3xs">
          <div>
            <h4 className="text-lg font-extrabold text-ids-sidebar leading-tight">
              ROOM {room.room_no}
            </h4>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
              {room.type_code} — {room.type_name}
            </span>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full font-black text-[10px] tracking-wider shadow-2xs border border-black/10 uppercase select-none ${statusMeta.color}`}
          >
            ● {statusMeta.label}
          </div>
        </div>

        {/* Room Spec Grid */}
        <div className="grid grid-cols-2 gap-3.5 bg-white border border-ids-border/60 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px] w-20">
              Floor:
            </span>
            <span className="font-bold text-gray-700">
              {room.floor === 6 ? "Penthouse" : `${room.floor}th Floor`}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px] w-20">
              Block/Wing:
            </span>
            <span className="font-mono font-bold text-gray-700">{room.block}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px] w-20">
              Max Adults:
            </span>
            <span className="font-bold text-gray-700">{room.max_adults}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px] w-20">
              Max Children:
            </span>
            <span className="font-bold text-gray-700">{room.max_children}</span>
          </div>
          <div className="flex items-center space-x-2 col-span-2">
            <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px] w-20">
              Smoking:
            </span>
            <span
              className={`font-extrabold ${
                room.is_smoking ? "text-red-500" : "text-green-600"
              }`}
            >
              {room.is_smoking ? "YES — SMOKING ALLOWED" : "NO — STRICTLY NON-SMOKING"}
            </span>
          </div>
        </div>

        {/* Guest Details (If Occupied / Has Reservation) */}
        {room.status === "occupied" || room.status === "reservation" ? (
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>Current Occupant & Folio Info</span>
            </div>
            <div className="bg-white border border-ids-border rounded-lg p-3.5 space-y-2.5 shadow-3xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block">
                    Guest Name
                  </span>
                  <p className="text-sm font-extrabold text-ids-sidebar mt-0.5">
                    Mr./Ms. {room.guest_name || reservation?.guest_name || "Santosh Biswakarma"}
                  </p>
                </div>
                {room.reservation_no && (
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">
                      Reservation #
                    </span>
                    <span className="font-mono text-xs font-black text-ids-header underline block mt-0.5">
                      {room.reservation_no}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-ids-border/30">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block flex items-center space-x-1">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>Check-In</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-700">
                    {reservation?.arrival ? reservation.arrival.toUpperCase() : todayFormatted}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Due Out</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-700">
                    {reservation?.departure ? reservation.departure.toUpperCase() : checkoutFormatted}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block flex items-center space-x-1">
                    <Building className="w-2.5 h-2.5" />
                    <span>Company</span>
                  </span>
                  <span className="text-xs font-extrabold text-gray-700 mt-0.5 block">
                    {reservation?.company_code ? `${reservation.company_code} LTD` : "Mahindra & Mahindra Ltd."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border border-dashed border-ids-border rounded-lg bg-gray-50/50 text-center text-gray-400 font-bold uppercase tracking-wider text-[10px]">
            No occupants or active bookings assigned to this room
          </div>
        )}

        {/* Quick Actions Panel */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Operational Quick Actions</span>
          </div>
          <div className="flex flex-col gap-2">{renderActionButtons()}</div>
        </div>

        {/* Footer info */}
        <div className="text-[9px] font-semibold text-gray-400 font-mono text-right pt-2 border-t border-ids-border/30">
          LAST MODIFIED: {todayFormatted} 19:52 BY {currentUser?.name || "IT ADMIN"}
        </div>
      </div>
    </BottomSheet>
  );
};
