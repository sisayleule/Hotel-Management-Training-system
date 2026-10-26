import React from "react";
import { FileText } from "lucide-react";

function NoteRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-[13px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-[15px] text-gray-900">{value}</p>
    </div>
  );
}

export function NotesCard({ reservation }) {
  const {
    special_notes,
    special_requests,
    internal_notes,
    cancellation_reason,
    status,
  } = reservation;

  const hasContent =
    special_notes || special_requests || internal_notes ||
    (status === "cancelled" && cancellation_reason);

  if (!hasContent) return null;

  return (
    <div className="bg-white border border-ids-border rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-gray-400" />
        <h2 className="text-[16px] font-semibold text-ids-sidebar">Notes &amp; requests</h2>
      </div>
      <div className="w-full h-px bg-ids-border mb-3" />

      <NoteRow label="Special notes"    value={special_notes} />
      <NoteRow label="Special requests" value={special_requests} />
      <NoteRow label="Internal notes"   value={internal_notes} />
      {status === "cancelled" && (
        <NoteRow label="Cancellation reason" value={cancellation_reason} />
      )}
    </div>
  );
}
