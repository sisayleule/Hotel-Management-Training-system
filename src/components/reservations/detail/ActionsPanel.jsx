import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, LogIn, LogOut, Home, FileEdit, X } from "lucide-react";

function Btn({ onClick, icon: Icon, children, variant = "primary" }) {
  const base = "w-full min-h-[48px] rounded-lg font-medium text-[15px] flex items-center justify-between px-4 gap-3 transition-colors cursor-pointer";
  const styles = {
    primary:   "bg-ids-header hover:bg-ids-sidebar text-white",
    secondary: "bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200",
    danger:    "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick}>
      <span className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </span>
      <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
    </button>
  );
}

export function ActionsPanel({ reservation }) {
  const navigate = useNavigate();
  const { reservation_no, status, rooms_assigned } = reservation;
  const roomNo = rooms_assigned?.[0] ?? "";

  if (status === "checked_out" || status === "cancelled") {
    return (
      <div className="bg-white border border-ids-border rounded-xl shadow-sm p-5">
        <h2 className="text-[16px] font-semibold text-ids-sidebar mb-3">Actions</h2>
        <p className="text-[14px] text-gray-500">
          {status === "checked_out"
            ? "This guest has checked out. No further actions are available."
            : "This reservation has been cancelled. No further actions are available."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-ids-border rounded-xl shadow-sm p-5">
      <h2 className="text-[16px] font-semibold text-ids-sidebar mb-4">Actions</h2>
      <div className="space-y-2">

        {status === "confirmed" && (
          <>
            <Btn icon={Home} onClick={() => navigate(`/app/reservations/assign?id=${reservation_no}`)}>
              Assign room
            </Btn>
            <Btn icon={LogIn} onClick={() => navigate(`/app/checkin?id=${reservation_no}`)}>
              Check in guest
            </Btn>
            <Btn icon={FileEdit} variant="secondary" onClick={() => navigate(`/app/reservations/amend?id=${reservation_no}`)}>
              Amend booking
            </Btn>
            <Btn icon={X} variant="danger" onClick={() => navigate(`/app/reservations/cancel?id=${reservation_no}`)}>
              Cancel booking
            </Btn>
          </>
        )}

        {status === "checked_in" && (
          <>
            <Btn icon={LogOut} onClick={() => navigate(`/app/checkout?id=${reservation_no}`)}>
              Check out guest
            </Btn>
            <Btn icon={ChevronRight} variant="secondary" onClick={() => navigate(`/app/cashiering?roomNo=${roomNo}`)}>
              Post charge
            </Btn>
          </>
        )}

      </div>
    </div>
  );
}
