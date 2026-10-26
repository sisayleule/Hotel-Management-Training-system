import React from "react";
import { DollarSign } from "lucide-react";
import { calculateCharges, fmtMoney } from "./helpers.js";

export function ChargesCard({ reservation }) {
  const cur = reservation.currency || "ETB";
  const c   = calculateCharges(reservation);

  const rows = [];

  // Room charge
  rows.push({
    desc:   "Room charge",
    detail: `${cur} ${c.rate.toLocaleString()} × ${c.nights} night${c.nights !== 1 ? "s" : ""}`,
    amount: c.roomCharge,
    bold:   false,
  });

  // Discount — skip if 0
  if (c.disc > 0) {
    rows.push({
      desc:   "Discount",
      detail: `${c.disc}%`,
      amount: -c.discountAmount,
      bold:   false,
    });
    rows.push({
      desc:   "Subtotal after discount",
      detail: "",
      amount: c.afterDiscount,
      bold:   false,
    });
  }

  // Tax — skip if 0
  if (c.tax > 0) {
    rows.push({
      desc:   "Tax",
      detail: `${c.tax}%`,
      amount: c.taxAmount,
      bold:   false,
    });
  }

  // Service charge — skip if 0
  if (c.svc > 0) {
    rows.push({
      desc:   "Service charge",
      detail: `${c.svc}%`,
      amount: c.serviceChargeAmt,
      bold:   false,
    });
  }

  // Adjustments — only if stored ≠ computed
  if (c.adjustment !== 0) {
    rows.push({
      desc:   "Other adjustments",
      detail: "",
      amount: c.adjustment,
      bold:   false,
    });
  }

  return (
    <div className="bg-white border border-ids-border rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-gray-400" />
        <h2 className="text-[16px] font-semibold text-ids-sidebar">Rate &amp; charges</h2>
      </div>
      <div className="w-full h-px bg-ids-border mb-3" />

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[12px] text-gray-400 uppercase tracking-wide">
            <th className="text-left pb-2 font-medium">Description</th>
            <th className="text-left pb-2 font-medium hidden sm:table-cell">Detail</th>
            <th className="text-right pb-2 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className={r.bold ? "font-semibold" : ""}>
              <td className="py-2 text-[14px] text-gray-700">{r.desc}</td>
              <td className="py-2 text-[13px] text-gray-400 hidden sm:table-cell">{r.detail}</td>
              <td className={`py-2 text-[14px] text-right tabular-nums ${r.amount < 0 ? "text-red-600" : "text-gray-900"}`}>
                {fmtMoney(r.amount, cur)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="pt-3 text-[15px] text-ids-sidebar">Total</td>
            <td className="hidden sm:table-cell" />
            <td className="pt-3 text-[15px] text-right tabular-nums text-ids-sidebar">
              {fmtMoney(c.stored, cur)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
