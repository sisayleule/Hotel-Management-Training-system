import React from "react";

export const Badge = ({ status, text, className = "" }) => {
  const getColors = (stat) => {
    switch (stat?.toLowerCase()) {
      case "confirmed":
      case "reservation":
        return "bg-status-confirmed/10 text-status-confirmed border-status-confirmed/30";
      case "checkedin":
      case "checked_in":
      case "occupied":
        return "bg-status-checkedin/10 text-status-checkedin border-status-checkedin/30";
      case "checkedout":
      case "checked_out":
        return "bg-status-checkedout/10 text-status-checkedout border-status-checkedout/30";
      case "cancelled":
        return "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/30";
      case "noshow":
      case "no_show":
      case "dirty":
        return "bg-status-noshow/10 text-status-noshow border-status-noshow/30";
      case "not_available":
      case "out_of_order":
        return "bg-slate-100 text-slate-600 border-slate-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const formattedText = text || status?.toUpperCase()?.replace("_", " ");

  return (
    <span
      id={`badge-${formattedText?.toLowerCase()?.replace(/\s+/g, "-")}`}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors(status)} ${className}`}
    >
      {formattedText}
    </span>
  );
};

export default Badge;
