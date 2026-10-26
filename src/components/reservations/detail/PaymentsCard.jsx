import React from "react";
import { CreditCard } from "lucide-react";
import { fmtDate, fmtMoney, paymentSummary } from "./helpers.js";

export function PaymentsCard({ reservation, companyName }) {
  const cur = reservation.currency || "ETB";
  const { payments, totalPaid, total, balance } = paymentSummary(reservation);

  const billedTo = reservation.company_code
    ? companyName || reservation.company_code
    : reservation.guest_name || "Guest";

  return (
    <div className="bg-white border border-ids-border rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-4 h-4 text-gray-400" />
        <h2 className="text-[16px] font-semibold text-ids-sidebar">Payments &amp; billing</h2>
      </div>
      <div className="w-full h-px bg-ids-border mb-3" />

      <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100">
        <span className="text-[13px] text-gray-500">Payment method</span>
        <span className="text-[15px] font-medium text-gray-900">{reservation.pay_mode || "Not provided"}</span>
      </div>
      <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100">
        <span className="text-[13px] text-gray-500">Billed to</span>
        <span className="text-[15px] font-medium text-gray-900">{billedTo}</span>
      </div>

      {/* Payment rows */}
      <div className="mt-4">
        {payments.length === 0 ? (
          <p className="text-[14px] text-gray-400 italic py-2">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="text-[12px] text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2 font-medium">Date</th>
                <th className="text-left pb-2 font-medium hidden sm:table-cell">Method</th>
                <th className="text-left pb-2 font-medium hidden md:table-cell">Remark</th>
                <th className="text-right pb-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p, i) => (
                <tr key={i}>
                  <td className="py-2 text-[14px] text-gray-700">{fmtDate(p.date)}</td>
                  <td className="py-2 text-[13px] text-gray-600 hidden sm:table-cell">{p.method || "—"}</td>
                  <td className="py-2 text-[13px] text-gray-400 hidden md:table-cell">{p.remark || "—"}</td>
                  <td className="py-2 text-[14px] text-right tabular-nums text-gray-900">
                    {fmtMoney(p.amount, cur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="border-t border-gray-200 pt-3 space-y-1">
          <div className="flex justify-between text-[14px] text-gray-600">
            <span>Total paid</span>
            <span className="tabular-nums font-medium">{fmtMoney(totalPaid, cur)}</span>
          </div>
          <div className={`flex justify-between text-[15px] font-semibold ${balance > 0.01 ? "text-red-700" : "text-green-700"}`}>
            <span>Balance due</span>
            <span className="tabular-nums">{fmtMoney(balance, cur)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
