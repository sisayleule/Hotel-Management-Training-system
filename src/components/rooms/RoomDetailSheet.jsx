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
  SlidersHorizontal,
  LogOut
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
  const navigate = useNavigate();
  const updateRoomStatus = useHotelStore((state) => state.updateRoomStatus);
  const checkOutGuest = useHotelStore((state) => state.checkOutGuest);
  const reservations = useHotelStore((state) => state.reservations);
  const currentUser = useHotelStore((state) => state.currentUser);
  const { can, currentRole } = usePermissions();

  // true when the logged-in role can change room status freely (HK or Manager)
  const canChangeStatus = can(PERMISSIONS.HOUSEKEEPING_UPDATE_STATUS) || can("*");
  // true when the role may only perform a checkout (FO)
  const checkoutOnly = can(PERMISSIONS.ROOMS_CHECKOUT_ONLY) && !canChangeStatus;

  // Loading state for each button action to show spinner
  const [loadingAction, setLoadingAction] = useState(null);

  if (!room) return null;

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

  // Rendering the dynamic action buttons based on status
  const renderActionButtons = () => {
    const isLd = (act) => loadingAction === act;
    const spinner = (
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    );

    // Shown to Front Office whenever a status-change panel would otherwise appear
    const hkOnlyNotice = (
      <div className="w-full rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 flex items-start space-x-3 text-xs">
        <span className="text-orange-500 text-base leading-none mt-0.5">🔒</span>
        <div>
          <p className="font-black text-orange-700 uppercase tracking-wide text-[10px]">
            Housekeeping Access Only
          </p>
          <p className="text-orange-600 mt-0.5 leading-snug">
            Changing this room's status (clean / dirty / out-of-order) is restricted to
            the <strong>Housekeeping</strong> role. Front Office may only perform
            guest check-out on an occupied room — the room is automatically set to
            <strong> Dirty</strong> upon checkout.
          </p>
        </div>
      </div>
    );

    switch (room.status) {
      case "vacant_clean":
        return (
          <>
            {/* Create Reservation — allowed for FO */}
            <button
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

            {/* Status-change buttons — housekeeping only */}
            {canChangeStatus ? (
              <>
                {/* Mark Out of Order */}
                <button
                  id="action-mark-ooo"
                  onClick={() =>
                    triggerAction(
                      "mark_ooo",
                      "out_of_order",
                      `Room ${room.room_no} marked as Out of Order ✓`
                    )
                  }
                  className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
                >
                  {isLd("mark_ooo") ? spinner : <Wrench className="w-5 h-5" />}
                  <span>Mark Out of Order</span>
                </button>

                {/* Mark Dirty */}
                <button
                  id="action-mark-dirty-action"
                  onClick={() =>
                    triggerAction(
                      "mark_dirty",
                      "dirty",
                      `Room ${room.room_no} marked as Dirty ✓`
                    )
                  }
                  className="w-full h-12 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
                >
                  {isLd("mark_dirty") ? spinner : <AlertTriangle className="w-5 h-5" />}
                  <span>Mark Dirty</span>
                </button>
              </>
            ) : (
              hkOnlyNotice
            )}
          </>
        );

      case "dirty":
      case "vacant_dirty":
        return (
          <>
            {/* Status-change buttons — housekeeping only */}
            {canChangeStatus ? (
              <>
                {/* Mark Clean */}
                <button
                  id="action-mark-clean"
                  onClick={() =>
                    triggerAction(
                      "mark_clean",
                      "vacant_clean",
                      `Room ${room.room_no} marked as Clean ✓`
                    )
                  }
                  className="w-full h-12 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
                >
                  {isLd("mark_clean") ? spinner : <Check className="w-5 h-5" />}
                  <span>Mark Clean</span>
                </button>

                {/* Create Reservation */}
                <button
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

                {/* Mark Out of Order */}
                <button
                  id="action-mark-ooo"
                  onClick={() =>
                    triggerAction(
                      "mark_ooo",
                      "out_of_order",
                      `Room ${room.room_no} marked as Out of Order ✓`
                    )
                  }
                  className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
                >
                  {isLd("mark_ooo") ? spinner : <Wrench className="w-5 h-5" />}
                  <span>Mark Out of Order</span>
                </button>
              </>
            ) : (
              /* FO: can only create a reservation once the room is clean — show notice */
              <>
                {hkOnlyNotice}
                <button
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
              </>
            )}
          </>
        );

      case "occupied":
        return (
          <>
            {/* Front Office: Quick Checkout button that directly sets room to dirty */}
            {checkoutOnly && (
              <button
                id="action-quick-checkout"
                onClick={() => {
                  setLoadingAction("quick_checkout");
                  // Directly set this room to dirty using the already-subscribed
                  // updateRoomStatus action. This works regardless of whether the
                  // reservation has rooms_assigned populated (seed data doesn't).
                  updateRoomStatus(room.room_no, "dirty", "", "");
                  // Also update the reservation status to checked_out if linked
                  if (room.reservation_no) {
                    checkOutGuest(room.reservation_no);
                  }
                  setTimeout(() => {
                    setLoadingAction(null);
                    toast.success(
                      `✓ Room ${room.room_no} checked out. Status set to Dirty.`,
                      { duration: 4000, style: { background: "#22c55e", color: "#fff", fontWeight: "bold" } }
                    );
                    onClose();
                  }, 600);
                }}
                className="w-full h-12 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
              >
                {isLd("quick_checkout") ? spinner : <LogOut className="w-5 h-5" />}
                <span>Quick Checkout → Set Dirty</span>
              </button>
            )}

            {/* Manager/HK: Full checkout page navigation */}
            {canChangeStatus && (
              <button
                id="action-checkout"
                onClick={() =>
                  triggerAction("checkout", null, "", () => {
                    navigate(`/app/checkout?roomNo=${room.room_no}&reservationNo=${room.reservation_no || ""}`);
                  })
                }
                className="w-full h-12 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
              >
                {isLd("checkout") ? spinner : <Trash2 className="w-5 h-5" />}
                <span>Check Out Guest</span>
              </button>
            )}

            {/* Post Charge — allowed for FO */}
            <button
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

            {/* Request Housekeeping — manually marks dirty; housekeeping-only */}
            {canChangeStatus && (
              <button
                id="action-request-hk"
                onClick={() =>
                  triggerAction(
                    "req_hk",
                    "dirty",
                    `Housekeeping requested for Room ${room.room_no} ✓`
                  )
                }
                className="w-full h-12 rounded-lg bg-orange-400 hover:bg-orange-500 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
              >
                {isLd("req_hk") ? spinner : <Clock className="w-5 h-5" />}
                <span>Request Housekeeping</span>
              </button>
            )}

            {/* Info notice for FO: checkout auto-sets dirty */}
            {checkoutOnly && (
              <div className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 flex items-start space-x-2 text-xs">
                <span className="text-blue-500 text-base leading-none mt-0.5">ℹ️</span>
                <p className="text-blue-700 leading-snug">
                  Checking out this guest will automatically mark the room as{" "}
                  <strong>Dirty</strong>. Housekeeping staff will then clean and
                  release it.
                </p>
              </div>
            )}
          </>
        );

      case "out_of_order":
      case "not_available":
        return (
          <>
            {canChangeStatus ? (
              <>
                {/* Mark Available */}
                <button
                  id="action-mark-clean"
                  onClick={() =>
                    triggerAction(
                      "mark_clean",
                      "vacant_clean",
                      `Room ${room.room_no} marked as Available/Clean ✓`
                    )
                  }
                  className="w-full h-12 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
                >
                  {isLd("mark_clean") ? spinner : <Check className="w-5 h-5" />}
                  <span>Mark Available (Clean)</span>
                </button>

                {/* Add Note */}
                <button
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
              </>
            ) : (
              hkOnlyNotice
            )}
          </>
        );

      case "reservation":
        return (
          <>
            {/* Check In Guest — allowed for FO */}
            <button
              id="action-checkin"
              onClick={() =>
                triggerAction("checkin", null, "", () => {
                  navigate(`/app/checkin?reservationNo=${room.reservation_no || ""}&roomNo=${room.room_no}`);
                })
              }
              className="w-full h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {isLd("checkin") ? (
                spinner
              ) : (
                <PlusCircle className="w-5 h-5" />
              )}
              <span>Check In Guest</span>
            </button>

            {/* View Reservation — allowed for FO */}
            <button
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

            {/* Cancel Reservation — changes room status back to vacant_clean; housekeeping-only */}
            {canChangeStatus && (
              <button
                id="action-cancel-res"
                onClick={() =>
                  triggerAction(
                    "cancel_res",
                    "vacant_clean",
                    `Reservation cancelled for Room ${room.room_no} ✓`
                  )
                }
                className="w-full h-12 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
              >
                {isLd("cancel_res") ? spinner : <Trash2 className="w-5 h-5" />}
                <span>Cancel Reservation</span>
              </button>
            )}
          </>
        );

      default:
        return canChangeStatus ? (
          <button
            onClick={() =>
              triggerAction(
                "mark_clean",
                "vacant_clean",
                `Room ${room.room_no} reset to clean ✓`
              )
            }
            className="w-full h-12 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
          >
            Reset to Available
          </button>
        ) : (
          hkOnlyNotice
        );
    }
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
