import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ReservationStatusBadge } from "./ReservationStatusBadge.jsx";
import { Calendar, CreditCard, Home, User, Edit2, Trash2, ArrowRight } from "lucide-react";

/**
 * @typedef {Object} Reservation
 * @property {string} reservation_no
 * @property {string} guest_name
 * @property {string} [company_code]
 * @property {string} room_type
 * @property {number} [nights]
 * @property {number} [adults]
 * @property {string} arrival
 * @property {string} departure
 * @property {string} pay_mode
 * @property {string} status
 * @property {string[]} [rooms_assigned]
 */

/**
 * ReservationCard component - Optimized for mobile layout with touch elements and actions
 * @param {Object} props
 * @param {Reservation} props.reservation
 */
export const ReservationCard = React.memo(({ reservation }) => {
  const navigate = useNavigate();
  const {
    reservation_no,
    guest_name,
    company_code,
    room_type,
    nights = 1,
    adults = 1,
    arrival,
    departure,
    pay_mode,
    status,
    rooms_assigned = [],
  } = reservation;

  const handleCardClick = () => {
    navigate(`/app/reservations/${reservation_no}`);
  };

  const isAssigned = rooms_assigned && rooms_assigned.length > 0;

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="bg-white border border-ids-border rounded-lg shadow-3xs overflow-hidden flex flex-col justify-between"
      id={`reservation-card-${reservation_no}`}
    >
      {/* Top Header Row: Resv# & Status Badge */}
      <div className="bg-gray-50 border-b border-ids-border/40 px-3.5 py-2.5 flex justify-between items-center select-none">
        <span className="font-mono font-black text-ids-sidebar text-[11px] tracking-wider uppercase">
          RESV #{reservation_no}
        </span>
        <ReservationStatusBadge status={status} />
      </div>

      {/* Main Content Info */}
      <div className="p-3.5 space-y-3 flex-1 cursor-pointer" onClick={handleCardClick}>
        <div>
          <h4 className="text-base font-extrabold text-ids-sidebar leading-tight tracking-tight">
            {guest_name}
          </h4>
          <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
            {company_code ? `Company: ${company_code} Ltd.` : "Individual Walk-In"}
          </p>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-1.5 select-none text-[10px] font-bold uppercase">
          <span className="px-2 py-0.5 bg-ids-sidebar/10 text-ids-sidebar rounded">
            {room_type} Room
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded flex items-center space-x-1">
            <User className="w-2.5 h-2.5 shrink-0" />
            <span>{adults} Adults</span>
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
            {nights} Nights
          </span>
        </div>

        {/* Date Interval row */}
        <div className="flex items-center space-x-2 text-xs text-gray-700 bg-gray-50/50 p-2 rounded border border-ids-border/30">
          <Calendar className="w-3.5 h-3.5 text-ids-header shrink-0" />
          <div className="font-mono font-bold flex items-center space-x-1.5">
            <span>{arrival}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span>{departure}</span>
          </div>
        </div>

        {/* Pay Mode and assigned rooms */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 select-none">
          <div className="flex items-center space-x-1.5">
            <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{pay_mode}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Home className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className={`font-semibold ${isAssigned ? "text-green-600 font-bold" : "text-orange-500 font-bold"}`}>
              {isAssigned ? `ROOM ${rooms_assigned.join(", ")}` : "Not Assigned"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Tray */}
      <div className="border-t border-ids-border/40 bg-gray-50/50 p-2 flex items-center gap-2 select-none">
        <button
          onClick={handleCardClick}
          className="flex-1 h-9 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-bold text-xs rounded uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
        >
          <span>View Details</span>
        </button>

        {status === "confirmed" && (
          <>
            <button
              onClick={() => navigate(`/app/reservations/amend?id=${reservation_no}`)}
              className="h-9 w-9 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded flex items-center justify-center transition-colors cursor-pointer"
              title="Amend Booking"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/app/reservations/cancel?id=${reservation_no}`)}
              className="h-9 w-9 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded flex items-center justify-center transition-colors cursor-pointer"
              title="Cancel Booking"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
});

ReservationCard.displayName = "ReservationCard";
export default ReservationCard;
