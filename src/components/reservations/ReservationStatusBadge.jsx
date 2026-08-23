import React from "react";

/**
 * Renders a styled badge representing a reservation status
 * @param {Object} props
 * @param {string} props.status
 */
export const ReservationStatusBadge = ({ status }) => {
  const normStatus = (status || "").toLowerCase().trim();

  let text = "CONFIRMED";
  let bgClass = "bg-blue-50 text-blue-700 border-blue-200";

  switch (normStatus) {
    case "confirmed":
      text = "CONFIRMED";
      bgClass = "bg-blue-100 text-blue-800 border-blue-300";
      break;
    case "checked_in":
    case "checked-in":
    case "checkedin":
      text = "CHECKED-IN";
      bgClass = "bg-green-100 text-green-800 border-green-300";
      break;
    case "checked_out":
    case "checked-out":
    case "checkedout":
      text = "CHECKED-OUT";
      bgClass = "bg-gray-100 text-gray-800 border-gray-300";
      break;
    case "cancelled":
    case "canceled":
      text = "CANCELLED";
      bgClass = "bg-red-100 text-red-800 border-red-300";
      break;
    case "no_show":
    case "no-show":
    case "noshow":
      text = "NO SHOW";
      bgClass = "bg-orange-100 text-orange-800 border-orange-300";
      break;
    case "tentative":
    case "waitlist":
      text = "TENTATIVE";
      bgClass = "bg-yellow-100 text-yellow-800 border-yellow-300";
      break;
    default:
      text = normStatus.toUpperCase().replace("_", " ");
      bgClass = "bg-slate-100 text-slate-800 border-slate-300";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${bgClass}`}
    >
      ● {text}
    </span>
  );
};

export default ReservationStatusBadge;
