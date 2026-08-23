import React from "react";
import ratePlans from "../../data/ratePlans.js";

/**
 * RateGrid Component
 * Displays the room rate plans list and highlights the currently selected row
 * @param {Object} props
 * @param {string} props.selectedRoomType - e.g. 'DLX', 'EXE', 'SUI', 'PNH'
 * @param {function(string, number): void} props.onSelectRatePlan - Callback when row clicked, receives roomType and single/double rate
 */
export const RateGrid = ({ selectedRoomType = "", onSelectRatePlan }) => {
  const normType = (selectedRoomType || "").toUpperCase().trim();

  const handleRowClick = (plan) => {
    if (onSelectRatePlan) {
      const activeRate = Number(plan.single || plan.double || 3500);
      onSelectRatePlan(plan.room_type, activeRate);
    }
  };

  return (
    <div className="space-y-2 select-none text-xs font-sans text-gray-800">
      <div className="border-b border-ids-border/60 pb-1.5 flex justify-between items-center">
        <h4 className="text-xs font-black text-ids-sidebar uppercase tracking-wider">
          Rate Details — Room & Occupancy Tariff
        </h4>
        <span className="text-[10px] font-bold text-gray-400">
          * Yellow Highlight denotes selected category plan
        </span>
      </div>

      <div className="bg-white border border-ids-border rounded-lg overflow-hidden shadow-3xs overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-ids-border text-[9px] font-black uppercase text-gray-400 tracking-wider">
              <th className="px-3.5 py-2.5">Description</th>
              <th className="px-3 py-2.5 text-right">Single</th>
              <th className="px-3 py-2.5 text-right">Double</th>
              <th className="px-3 py-2.5 text-right">Triple</th>
              <th className="px-3 py-2.5 text-right">Quad</th>
              <th className="px-3 py-2.5 text-right">Tax (Standard)</th>
              <th className="px-3 py-2.5 text-right font-bold text-ids-header">Ext Adult</th>
              <th className="px-3 py-2.5 text-right">Ext Child</th>
              <th className="px-3.5 py-2.5 text-right">Ext Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ids-border/30 font-mono font-bold text-gray-700">
            {ratePlans.map((plan) => {
              // Highlight selected room types
              const isSelected = normType === plan.room_type || (normType + "_PLAN") === plan.room_type || plan.room_type.startsWith(normType);
              
              return (
                <tr
                  key={plan.room_type}
                  onClick={() => handleRowClick(plan)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50/70 text-[11px] ${
                    isSelected
                      ? "bg-amber-100/90 text-amber-950 border-y border-amber-300"
                      : ""
                  }`}
                >
                  <td className="px-3.5 py-2 font-sans font-extrabold text-ids-sidebar text-xs text-left">
                    {plan.description}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {plan.single ? `₹${plan.single}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {plan.double ? `₹${plan.double}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {plan.triple ? `₹${plan.triple}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {plan.quad ? `₹${plan.quad}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500">
                    {plan.tax ? `₹${plan.tax}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-ids-header font-black">
                    {plan.ext_adult ? `₹${plan.ext_adult}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500">
                    {plan.ext_child ? `₹${plan.ext_child}` : "—"}
                  </td>
                  <td className="px-3.5 py-2 text-right text-gray-400">
                    {plan.tax_ext ? `₹${plan.tax_ext}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RateGrid;
