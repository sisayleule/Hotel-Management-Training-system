import React from "react";
import { fmtDate, fmtMoney, paymentChip } from "./helpers.js";

function Tile({ label, value, sub }) {
  return (
    <div className="bg-white border border-ids-border rounded-xl p-4 flex-1 min-w-0">
      <p className="text-[13px] text-gray-500 mb-1">{label}</p>
      <p className="text-[17px] font-semibold text-ids-sidebar leading-snug break-words">{value}</p>
      {sub && <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function SummaryStrip({ reservation }) {
  const {
    guest_name, arrival, departure, nights,
    room_type, rooms_assigned, total_amount, rate, currency = "ETB",
  } = reservation;

  const roomLabel = rooms_assigned?.length > 0
    ? rooms_assigned.join(", ")
    : "Not assigned";

  const total  = total_amount != null ? Number(total_amount) : Number(rate || 0) * Number(nights || 1);
  const chip   = paymentChip(reservation);
  const arrive = fmtDate(arrival);
  const depart = fmtDate(departure);
  const stayStr = nights === 1 ? `${arrive} · 1 night` : `${arrive} – ${depart}, ${nights} nights`;

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <Tile label="Guest"  value={guest_name || "Not provided"} />
      <Tile label="Stay"   value={stayStr} />
      <Tile label="Room"   value={room_type} sub={roomLabel} />
      <Tile
        label="Total"
        value={fmtMoney(total, currency)}
        sub={
          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${chip.cls}`}>
            {chip.label}
          </span>
        }
      />
    </div>
  );
}
