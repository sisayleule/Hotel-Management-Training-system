import React from "react";

const ByBillView = ({ currentOrder, onBackToMenu, onSubmit, canSubmit }) => {
  // Group items by category
  const groupByCategory = () => {
    const grouped = {};
    
    currentOrder.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    
    return grouped;
  };

  const grouped = groupByCategory();
  const categories = Object.keys(grouped);

  // Calculate totals
  const subtotal = currentOrder.reduce((sum, item) => {
    return sum + (item.isComplimentary ? 0 : item.lineTotal);
  }, 0);
  const serviceCharge = subtotal * 0.10; // 10%
  const tax = subtotal * 0.15; // 15%
  const grandTotal = subtotal + serviceCharge + tax;

  // Format category name for display
  const formatCategoryName = (category) => {
    return category.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ").toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Order Items by Category */}
      <div className="divide-y divide-gray-300">
        {categories.map(category => (
          <div key={category}>
            {/* Category Header */}
            <div className="px-6 py-3" style={{ backgroundColor: "#ff8c42" }}>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                {formatCategoryName(category)}
              </h3>
            </div>
            
            {/* Items in Category */}
            <div className="divide-y divide-gray-200">
              {grouped[category].map(item => (
                <div key={item.id} className="px-6 py-3 flex justify-between items-center">
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${item.isComplimentary ? "text-gray-500" : "text-gray-900"}`}>
                      {item.quantity}x {item.name}
                      {item.isComplimentary && <span className="ml-2 text-xs uppercase">(COMP)</span>}
                    </span>
                  </div>
                  <div className={`text-sm font-mono font-bold ${item.isComplimentary ? "line-through text-gray-400" : "text-gray-900"}`}>
                    ₹{item.lineTotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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

export default ByBillView;
