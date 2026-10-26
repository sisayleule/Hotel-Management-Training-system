import React from "react";
import { Calendar } from "lucide-react";
import { fmtDate, rateCodeLabel, mealPlanLabel } from "./helpers.js";

const NP = "Not provided";

function Row({ label, value }) {
  const display = (value === undefined || value === null || value === "") ? NP : String(value);
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-[13px] text-gray-500 shrink-0">{label}</span>
      <span className="text-[15px] font-medium text-gray-900 text-right">{display}</span>
    </div>
  );
}

export function StayCard({ reservation, roomTypeName, companyName }) {
  const {
    arrival, departure, nights, room_type,
    rooms_assigned, rate_code, meal_plan, company_code,
  } = reservation;

  const roomNo = rooms_assigned?.length > 0 ? rooms_assigned.join(", ") : "Not assigned yet";
  const bookingType = company_code
    ? `Company — ${companyName || company_code}`
    : "Individual";

  return (
    <div className="bg-white border border-ids-border rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-gray-400" />
        <h2 className="text-[16px] font-semibold text-ids-sidebar">Stay details</h2>
      </div>
      <div className="w-full h-px bg-ids-border mb-3" />

      <Row label="Arrival"       value={fmtDate(arrival)} />
      <Row label="Departure"     value={fmtDate(departure)} />
      <Row label="Nights"        value={nights} />
      <Row label="Room type"     value={roomTypeName || room_type} />
      <Row label="Room number"   value={roomNo} />
      <Row label="Rate code"     value={rate_code ? rateCodeLabel(rate_code) : NP} />
      <Row label="Meal plan"     value={meal_plan ? mealPlanLabel(meal_plan) : NP} />
      <Row label="Booking type"  value={bookingType} />
    </div>
  );
}
