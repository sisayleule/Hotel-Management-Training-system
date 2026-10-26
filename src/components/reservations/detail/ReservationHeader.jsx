import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { STATUS_LABEL, STATUS_CHIP } from "./helpers.js";

export function ReservationHeader({ reservation }) {
  const navigate = useNavigate();
  const { reservation_no, guest_name, status } = reservation;
  const label = STATUS_LABEL[status] ?? status ?? "Unknown";
  const chip  = STATUS_CHIP[status]  ?? "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="flex items-start gap-3 mb-6">
      <button
        onClick={() => navigate("/app/reservations")}
        className="mt-1 p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 shrink-0 transition-colors"
        aria-label="Back to reservations"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">
          Reservations &rsaquo; {reservation_no}
        </p>
        <h1 className="text-2xl font-semibold text-ids-sidebar leading-tight">
          Reservation {reservation_no}
        </h1>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium border ${chip}`}>
          {label}
        </span>
      </div>
    </div>
  );
}
