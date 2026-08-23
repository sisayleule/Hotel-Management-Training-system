import React from "react";

const ByDescriptionView = ({ currentOrder, onBackToMenu, onSubmit, canSubmit }) => {
  // Sort items by entry sequence
  const sortedItems = [...currentOrder].sort((a, b) => a.entrySequence - b.entrySequence);

  // Calculate totals
  const subtotal = currentOrder.reduce((sum, item) => {
    return sum + (item.isComplimentary ? 0 : item.lineTotal);
  }, 0);
  const serviceCharge = subtotal * 0.10; // 10%
  const tax = subtotal * 0.15; // 15%
  const grandTotal = subtotal + serviceCharge + tax;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr style={{ backgroundColor: "#ff8c42" }}>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                QTY
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                ITEM NAME
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                LINE TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedItems.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={item.isComplimentary ? "text-gray-500" : "text-gray-900"}>
                    {item.name}
                    {item.isComplimentary && <span className="ml-2 text-xs uppercase">(COMP)</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className={`font-mono font-bold ${item.isComplimentary ? "line-through text-gray-400" : "text-gray-900"}`}>
                    ₹{item.lineTotal.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="px-6 py-4 bg-gray-50 border-t-4" style={{ borderTopColor: "#ff8c42" }}>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-700">SUBTOTAL:</span>
            <span className="font-mono text-gray-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-700">SERVICE CHARGE (10%):</span>
            <span className="font-mono text-gray-900">₹{serviceCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-700">TAX (15%):</span>
            <span className="font-mono text-gray-900">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-300">
            <span className="text-lg font-bold text-gray-900 uppercase">GRAND TOTAL:</span>
            <span className="text-xl font-bold font-mono" style={{ color: "#ff8c42" }}>
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-white border-t flex gap-3 justify-end">
        <button
          onClick={onBackToMenu}
          className="px-6 py-3 rounded-lg font-bold uppercase text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          BACK TO MENU
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`px-6 py-3 rounded-lg font-bold uppercase text-white transition-colors ${
            canSubmit 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          SUBMIT ORDER
        </button>
      </div>
    </div>
  );
};

export default ByDescriptionView;
