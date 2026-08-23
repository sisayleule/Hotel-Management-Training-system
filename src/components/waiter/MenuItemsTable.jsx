import React from "react";

const MenuItemsTable = ({ items, selectedCategory, onAddItem }) => {
  const filteredItems = items.filter(item => item.category === selectedCategory && item.available);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: "#ff8c42" }}>
            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
              ITEM NAME
            </th>
            <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
              PRICE
            </th>
            <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
              ACTION
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredItems.length === 0 ? (
            <tr>
              <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                No items available in this category
              </td>
            </tr>
          ) : (
            filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                  ₹{item.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => onAddItem(item)}
                    className="px-4 py-2 rounded-md font-bold uppercase text-white text-xs transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: "#1a5c5c" }}
                  >
                    ADD
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MenuItemsTable;
