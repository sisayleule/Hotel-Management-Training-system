import React, { useState } from "react";
import { Search, X } from "lucide-react";
import Modal from "./Modal.jsx";

export const SearchPopup = ({ isOpen, onClose, title, items = [], searchKeys = [], columns = [], onSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return searchKeys.some((key) => {
      const val = item[key];
      return val && String(val).toLowerCase().includes(query);
    });
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClass="max-w-2xl">
      <div id="search-popup" className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            id="search-popup-input"
            type="text"
            placeholder="Type to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
            autoFocus
          />
          {searchQuery && (
            <button
              id="search-popup-clear"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results table */}
        <div className="border border-ids-border rounded overflow-hidden max-h-[50vh] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-ids-bg text-gray-700 font-semibold border-b border-ids-border">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 border-r last:border-r-0 border-ids-border">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ids-border">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, rowIdx) => (
                  <tr
                    key={rowIdx}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="hover:bg-ids-bg/40 cursor-pointer transition-colors"
                  >
                    {columns.map((col, colIdx) => {
                      const cellValue = typeof col.accessor === "function"
                        ? col.accessor(item)
                        : item[col.accessor];
                      return (
                        <td key={colIdx} className="px-3 py-2 border-r last:border-r-0 border-ids-border text-gray-600">
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-500 text-right">
          Showing {filteredItems.length} of {items.length} records.
        </p>
      </div>
    </Modal>
  );
};

export default SearchPopup;
