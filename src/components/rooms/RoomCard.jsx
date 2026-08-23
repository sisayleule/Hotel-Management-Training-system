import React from "react";
import { motion } from "motion/react";

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
 */

/**
 * RoomCard Component - represents a single room cell on the status board
 * @param {Object} props
 * @param {Room} props.room
 * @param {function(Room): void} props.onClick
 */
export const RoomCard = React.memo(({ room, onClick }) => {
  const { room_no, type_code, status, guest_name } = room;

  // Determine exact styles based on status
  let bgClass = "bg-gray-200 text-gray-400";
  let textClass = "text-white";

  switch (status) {
    case "vacant_clean":
      bgClass = "bg-green-500";
      textClass = "text-white";
      break;
    case "dirty":
    case "vacant_dirty":
      bgClass = "bg-orange-400";
      textClass = "text-white";
      break;
    case "occupied":
      bgClass = "bg-red-500";
      textClass = "text-white";
      break;
    case "out_of_order":
    case "not_available":
      bgClass = "bg-blue-500";
      textClass = "text-white";
      break;
    case "out_of_service":
    case "oos":
      bgClass = "bg-purple-500";
      textClass = "text-white";
      break;
    case "reservation":
      bgClass = "bg-yellow-400";
      textClass = "text-gray-800";
      break;
    case "departure":
      bgClass = "bg-gray-400";
      textClass = "text-white";
      break;
    default:
      bgClass = "bg-gray-200";
      textClass = "text-gray-400";
  }

  // Parse guest name into Last Name and First Name if occupied
  let lastName = "";
  let firstName = "";

  if (guest_name) {
    const parts = guest_name.trim().split(/\s+/);
    if (parts.length > 1) {
      // Last name is usually first in our dataset (e.g. "Biswakarma Santosh") or we can handle reasonably
      // Let's assume standard format or just split:
      lastName = parts[0].toUpperCase();
      firstName = parts.slice(1).join(" ");
    } else {
      lastName = parts[0].toUpperCase();
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 0.98, filter: "brightness(0.92)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={() => onClick(room)}
      className={`relative w-full h-[56px] sm:h-[64px] lg:h-[68px] p-[3px] sm:p-1 rounded shadow-3xs cursor-pointer select-none transition-all duration-300 flex flex-col justify-between overflow-hidden border border-black/10 ${bgClass} ${textClass}`}
      id={`room-card-${room_no}`}
    >
      {/* Top Row: Room number (left), Type code (right) */}
      <div className="flex justify-between items-start text-[9px] sm:text-[10px] font-semibold leading-none tracking-tight">
        <span className="font-mono font-bold">{room_no}</span>
        <span className="font-mono">{type_code}</span>
      </div>

      {/* Wave occupancy indicator or status detail */}
      <div className="text-center text-[8px] tracking-widest leading-none opacity-80 h-3 flex items-center justify-center select-none">
        {status === "occupied" ? "~~~~" : status === "reservation" ? "••••" : "~"}
      </div>

      {/* Center: Guest name (if occupied) */}
      <div className="flex-1 flex flex-col justify-center items-center leading-tight">
        {guest_name ? (
          <>
            <span className="text-[9px] sm:text-[11px] font-extrabold font-sans tracking-tight truncate max-w-full block">
              {lastName}
            </span>
            {firstName && (
              <span className="text-[8px] sm:text-[10px] font-medium font-sans truncate max-w-full block opacity-90">
                {firstName}
              </span>
            )}
          </>
        ) : (
          <span className="text-[8px] sm:text-[9px] font-semibold tracking-wider uppercase opacity-60">
            {status === "vacant_clean" ? "VACANT" : status === "dirty" ? "DIRTY" : status.replace("_", " ")}
          </span>
        )}
      </div>
    </motion.div>
  );
});

RoomCard.displayName = "RoomCard";
