import React from "react";
import { User } from "lucide-react";

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

export function GuestInfoCard({ reservation, guest }) {
  // guest may be undefined if name didn't match — show what we have
  return (
    <div className="bg-white border border-ids-border rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-gray-400" />
        <h2 className="text-[16px] font-semibold text-ids-sidebar">Guest information</h2>
      </div>
      <div className="w-full h-px bg-ids-border mb-3" />

      <Row label="Full name"   value={reservation.guest_name} />
      <Row label="Phone"       value={guest?.phone} />
      <Row label="Email"       value={guest?.email} />
      <Row label="ID type"     value={guest?.identity_type} />
      <Row label="ID number"   value={guest?.identity_no} />
      <Row label="Adults"      value={reservation.adults ?? 0} />
      <Row label="Children"    value={reservation.children ?? 0} />
    </div>
  );
}
