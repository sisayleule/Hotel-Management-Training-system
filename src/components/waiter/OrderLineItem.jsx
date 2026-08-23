import React from "react";

const OrderLineItem = ({ item, onIncrease, onDecrease, onToggleComp, onDelete }) => {
  const isComp = item.isComplimentary;

  return (
    <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-200">
      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onDecrease(item.id)}
          className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: "#1a5c5c" }}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-8 text-center font-bold text-gray-900">
          {item.quantity}
        </span>
        <button
          onClick={() => onIncrease(item.id)}
          className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: "#1a5c5c" }}
          aria-label="Increase quantity"
          disabled={item.quantity >= 99}
        >
          +
        </button>
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${isComp ? "text-gray-500" : "text-gray-900"}`}>
          {item.name}
          {isComp && <span className="ml-2 text-xs uppercase">(COMP)</span>}
        </div>
        <div className={`text-xs font-mono mt-1 ${isComp ? "line-through text-gray-400" : "text-gray-600"}`}>
          ₹{item.unitPrice.toFixed(2)} × {item.quantity} = ₹{(item.unitPrice * item.quantity).toFixed(2)}
        </div>
        {/* Show outlet/restaurant source if available */}
        {item.outlet && (
          <div className="text-xs text-gray-500 mt-0.5">
            {item.outlet.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            {item.restaurant && ` - ${item.restaurant.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`}
          </div>
        )}
      </div>

      {/* Line Total */}
      <div className={`text-sm font-mono font-bold ${isComp ? "text-gray-400 line-through" : "text-gray-900"}`}>
        ₹{item.lineTotal.toFixed(2)}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onToggleComp(item.id)}
          className={`px-3 py-1 rounded text-xs font-bold uppercase ${
            isComp 
              ? "text-white" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          style={isComp ? { backgroundColor: "#ff8c42" } : {}}
          aria-label="Toggle complimentary"
        >
          COMP
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="px-3 py-1 rounded text-xs font-bold uppercase bg-red-600 text-white hover:bg-red-700"
          aria-label="Delete item"
        >
          DEL
        </button>
      </div>
    </div>
  );
};

export default OrderLineItem;
