import React from "react";
import { Check, X } from "lucide-react";
import { fmtDate } from "./helpers.js";

export function StatusTimeline({ reservation }) {
  const { status, arrival, departure, created_at, cancellation_reason } = reservation;
  const isCancelled = status === "cancelled";

  // Steps for normal flow
  const steps = isCancelled
    ? [
        { key: "booked",    label: "Booked",    date: created_at ? fmtDate(created_at) : null },
        { key: "cancelled", label: "Cancelled", date: null, red: true },
      ]
    : [
        { key: "confirmed",   label: "Booked",       date: created_at ? fmtDate(created_at) : null },
        { key: "checked_in",  label: "Checked in",   date: status === "checked_in" || status === "checked_out" ? fmtDate(arrival) : null },
        { key: "checked_out", label: "Checked out",  date: status === "checked_out" ? fmtDate(departure) : null },
      ];

  const ORDER = ["confirmed", "checked_in", "checked_out"];
  const currentIdx = isCancelled ? 1 : Math.max(ORDER.indexOf(status), 0);

  return (
    <div className="bg-white border border-ids-border rounded-xl shadow-sm p-5">
      <h2 className="text-[16px] font-semibold text-ids-sidebar mb-4">Status</h2>

      <ol className="relative border-l-2 border-gray-200 ml-3 space-y-6">
        {steps.map((step, i) => {
          const isActive  = i === currentIdx;
          const isDone    = !isCancelled && i < currentIdx;
          const isFuture  = !isDone && !isActive;
          const isRedStep = step.red;

          const circleCls = isRedStep
            ? "bg-red-500 border-red-500 text-white"
            : isActive
            ? "bg-ids-header border-ids-header text-white"
            : isDone
            ? "bg-green-500 border-green-500 text-white"
            : "bg-white border-gray-300 text-gray-300";

          const labelCls = isRedStep
            ? "text-red-700 font-semibold"
            : isActive
            ? "text-ids-sidebar font-semibold"
            : isDone
            ? "text-gray-700 font-medium"
            : "text-gray-400";

          return (
            <li key={step.key} className="ml-6">
              <span className={`absolute -left-3.5 flex items-center justify-center w-6 h-6 rounded-full border-2 ${circleCls}`}>
                {isRedStep
                  ? <X className="w-3 h-3" />
                  : isDone || isActive
                  ? <Check className="w-3 h-3" />
                  : null}
              </span>
              <p className={`text-[14px] ${labelCls}`}>{step.label}</p>
              {step.date && (
                <p className="text-[12px] text-gray-400 mt-0.5">{step.date}</p>
              )}
              {!step.date && isActive && !isCancelled && (
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {step.key === "checked_in"  ? `Expected ${fmtDate(arrival)}`   : ""}
                  {step.key === "checked_out" ? `Expected ${fmtDate(departure)}` : ""}
                  {step.key === "confirmed"   ? "Today"                          : ""}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
