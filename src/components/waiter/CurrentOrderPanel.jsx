import React from "react";
import OrderLineItem from "./OrderLineItem";

const CurrentOrderPanel = ({ 
  currentOrder, 
  calculateTotal,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onToggleComplimentary,
  onDeleteItem,
  onAddMoreItems // New prop
}) => {
  const subtotal = calculateTotal();
  const serviceCharge = subtotal * 0.10; // 10%
  const tax = subtotal * 0.15; // 15%
  const grandTotal = subtotal + serviceCharge + tax;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3" style={{ backgroundColor: "#ff8c42" }}>
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
          CURRENT ORDER
        </h3>
      </div>

      {/* Order Items */}
      <div>
        {currentOrder.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No items in order
          </div>
        ) : (
          currentOrder.map((item) => (
            <OrderLineItem
              key={item.id}
              item={item}
              onIncrease={onIncreaseQuantity}
              onDecrease={onDecreaseQuantity}
              onToggleComp={onToggleComplimentary}
              onDelete={onDeleteItem}
            />
          ))
        )}
      </div>

      {/* Total */}
      {currentOrder.length > 0 && (
        <div 
          className="px-6 py-4 border-t-4" 
          style={{ borderTopColor: "#ff8c42" }}
        >
          {/* Subtotal */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700 uppercase">
              Subtotal:
            </span>
            <span className="text-sm font-mono text-gray-900">
              ₹{subtotal.toFixed(2)}
            </span>
          </div>
          
          {/* Service Charge */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700 uppercase">
              Service Charge (10%):
            </span>
            <span className="text-sm font-mono text-gray-900">
              ₹{serviceCharge.toFixed(2)}
            </span>
          </div>
          
          {/* Tax */}
          <div className="flex justify-between items-center mb-3 pb-3 border-b-2 border-gray-200">
            <span className="text-sm font-semibold text-gray-700 uppercase">
              Tax (15%):
            </span>
            <span className="text-sm font-mono text-gray-900">
              ₹{tax.toFixed(2)}
            </span>
          </div>
          
          {/* Grand Total */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-bold text-gray-900 uppercase">
              TOTAL:
            </span>
            <span className="text-xl font-bold font-mono" style={{ color: "#ff8c42" }}>
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
          
          {/* ADD MORE ITEMS button */}
          {onAddMoreItems && (
            <button
              onClick={onAddMoreItems}
              className="w-full px-4 py-2 rounded-lg font-bold uppercase text-white hover:opacity-90 transition-opacity text-sm"
              style={{ backgroundColor: "#1a5c5c" }}
            >
              + ADD MORE ITEMS
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrentOrderPanel;
