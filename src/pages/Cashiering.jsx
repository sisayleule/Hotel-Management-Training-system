import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReservations } from "../hooks/useReservations.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { formatCurrency } from "../utils/formatters.js";
import { Search, Wallet, FileText, PlusCircle, CreditCard, ChevronRight } from "lucide-react";
import EmptyState from "../components/ui/EmptyState.jsx";
import toast from "react-hot-toast";
import { RequirePermission } from "../components/auth/RequirePermission.jsx";
import { PERMISSIONS } from "../config/rbac.js";

export const Cashiering = () => {
  const navigate = useNavigate();
  const { reservations } = useReservations();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter inhouse accounts
  const inhouseReservations = reservations.filter((res) => res.status === "checked_in");

  const filteredInhouse = inhouseReservations.filter((res) =>
    res.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.reservation_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.rooms_assigned.join(", ").includes(searchQuery)
  );

  return (
    <PageWrapper
      title="Front Office Cashiering"
      subtitle="Settle folios, review active guest ledgers, post extra charges, and process payment transactions"
    >
      {/* Cashiering Search Controls */}
      <div id="cashiering-controls" className="bg-white border border-ids-border p-4 rounded shadow-3xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            id="cashier-search"
            type="text"
            placeholder="Search by room number, guest name, or folio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-xs"
          />
        </div>

        <div className="text-[11px] font-bold text-gray-500 font-mono text-right">
          Active inhouse folios: <span className="text-orange-600 text-sm font-bold">{inhouseReservations.length}</span>
        </div>
      </div>

      {/* Ledgers table */}
      <div id="ledgers-table-wrapper" className="bg-white border border-ids-border rounded overflow-hidden shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse select-none text-xs">
          <thead className="bg-ids-sidebar text-white font-bold border-b border-ids-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Room No.</th>
              <th className="px-4 py-3 font-semibold">Folio Ref</th>
              <th className="px-4 py-3 font-semibold">Primary Guest</th>
              <th className="px-4 py-3 font-semibold text-right">Total Charges</th>
              <th className="px-4 py-3 font-semibold text-right">Settled Amount</th>
              <th className="px-4 py-3 font-semibold text-right">Balance Outstanding</th>
              <th className="px-4 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ids-border">
            {filteredInhouse.length > 0 ? (
              filteredInhouse.map((res) => {
                const totalPayments = (res.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
                const balance = res.total_amount - totalPayments;
                return (
                  <tr
                    key={res.reservation_no}
                    id={`ledger-row-${res.reservation_no}`}
                    onClick={() => navigate(`/reservations/${res.reservation_no}`)}
                    className="hover:bg-ids-bg/30 cursor-pointer transition-colors font-sans"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-orange-600 text-sm">
                      Room {res.rooms_assigned.join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-ids-header">
                      {res.reservation_no}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700">
                      {res.guest_name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-600">
                      {formatCurrency(res.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-green-600">
                      {formatCurrency(totalPayments)}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <RequirePermission permission={PERMISSIONS.BILLING_POST_CHARGES}>
                        <button
                          id={`btn-open-cashier-folio-${res.reservation_no}`}
                          onClick={() => navigate(`/reservations/${res.reservation_no}`)}
                          className="px-3 py-1 bg-ids-header hover:bg-ids-sidebar text-white font-bold text-[10px] rounded flex items-center justify-center space-x-1 shadow-2xs mx-auto"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Post / Settle</span>
                        </button>
                      </RequirePermission>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8">
                  <EmptyState
                    title="No in-house residents found"
                    description="There are no active checked-in occupants found matching your search term."
                    icon={Wallet}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default Cashiering;
