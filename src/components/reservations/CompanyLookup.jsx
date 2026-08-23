import React, { useState, useMemo } from "react";
import { useHotelStore } from "../../store/useHotelStore.js";
import { useEnterAsTab } from "../../hooks/useEnterAsTab.js";
import { Search, ShieldAlert, CheckCircle, X } from "lucide-react";

/**
 * CompanyLookup Popup
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function(): void} props.onClose
 * @param {function({ code: string, name: string }): void} props.onSelect
 */
export const CompanyLookup = ({ isOpen, onClose, onSelect }) => {
  const companies = useHotelStore((state) => state.companies);
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  // Use excludeSearch: true to prevent Enter key from focusing the search field
  const searchContainerRef = useEnterAsTab({ 
    onSubmit: (e) => {
      e.preventDefault();
      handleSelectConfirm();
    },
    excludeSearch: true 
  });

  if (!isOpen) return null;

  // Real-time filtering across all columns
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.company_code?.toLowerCase().includes(q) ||
        c.company_name?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.area?.toLowerCase().includes(q)
    );
  }, [companies, search]);

  const handleRowClick = (comp) => {
    setSelectedRow(comp);
  };

  const handleSelectConfirm = () => {
    if (selectedRow) {
      if (selectedRow.is_blacklisted) {
        alert(`WARNING: This profile (${selectedRow.company_name}) is currently blacklisted!`);
      }
      onSelect({ code: selectedRow.company_code, name: selectedRow.company_name });
      onClose();
    }
  };

  return (
    <div
      id="company-lookup-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
    >
      <div ref={searchContainerRef} className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-lg shadow-xl flex flex-col overflow-hidden text-xs font-sans text-gray-800">
        
        {/* Header bar */}
        <div className="bg-ids-sidebar text-white p-3.5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm font-black tracking-wider uppercase">
              Company Profile V6.5.002.1
            </h3>
            <p className="text-[10px] text-white/75 font-semibold mt-0.5">
              Select Profile for direct routing / invoicing billing instructions
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar row */}
        <div className="p-3 bg-gray-50 border-b border-ids-border/50 flex flex-col sm:flex-row sm:items-center gap-3.5 shrink-0">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="company-search-field"
              type="text"
              placeholder="Filter company profile by name, code, area, or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedRow(null);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-ids-border rounded font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header"
            />
          </div>
          <button
            type="button"
            className="px-4 py-1.5 bg-ids-header text-white font-bold rounded text-[11px] uppercase tracking-wide cursor-pointer"
          >
            Company Profile
          </button>
        </div>

        {/* Table Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto max-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-[9px] tracking-wider sticky top-0 border-b border-ids-border">
              <tr>
                <th className="px-3.5 py-2.5 w-24">Company Code</th>
                <th className="px-3.5 py-2.5">Company Name</th>
                <th className="px-3.5 py-2.5 w-24 text-center">Black Listed</th>
                <th className="px-3.5 py-2.5 w-20 text-center">Status</th>
                <th className="px-3.5 py-2.5">Area</th>
                <th className="px-3.5 py-2.5">City</th>
                <th className="px-3.5 py-2.5">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ids-border/30">
              {filtered.map((c) => {
                const isSelected = selectedRow?.company_code === c.company_code;
                const isBlack = c.is_blacklisted || c.black_listed === "Yes";
                return (
                  <tr
                    key={c.company_code}
                    onClick={() => handleRowClick(c)}
                    className={`cursor-pointer transition-colors text-[11px] sm:h-12 h-14 ${
                      isSelected
                        ? "bg-blue-50 border-y-2 border-blue-200"
                        : "hover:bg-gray-50/50"
                    }`}
                  >
                    <td className="px-3.5 py-2 font-mono font-black text-ids-header">
                      {c.company_code}
                    </td>
                    <td className="px-3.5 py-2 font-extrabold text-ids-sidebar text-xs">
                      {c.company_name}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      {isBlack ? (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-black tracking-wider uppercase rounded inline-flex items-center space-x-1 border border-red-200">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          <span>BLISTED</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold uppercase text-[9px]">No</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold rounded inline-flex items-center space-x-0.5 border border-green-200">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>ACTIVE</span>
                      </span>
                    </td>
                    <td className="px-3.5 py-2 font-medium text-gray-500 truncate max-w-[120px]">
                      {c.area || "—"}
                    </td>
                    <td className="px-3.5 py-2 font-bold text-gray-700 truncate max-w-[100px]">
                      {c.city || "—"}
                    </td>
                    <td className="px-3.5 py-2 font-semibold text-gray-500">
                      {c.country || "IN"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-400 font-bold uppercase tracking-widest">
                    No matching company profiles registered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions Tray */}
        <div className="bg-gray-50 border-t border-ids-border p-3 flex justify-between items-center select-none shrink-0 sticky bottom-0">
          <div className="text-gray-500 font-semibold font-mono text-[10px]">
            {selectedRow ? (
              <span className="text-ids-header font-black">
                SELECTED: {selectedRow.company_name}
              </span>
            ) : (
              "Please select a company row from the table above"
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (filtered.length > 0) {
                  // select first as next
                  const idx = filtered.indexOf(selectedRow || filtered[0]);
                  const nextIdx = (idx + 1) % filtered.length;
                  setSelectedRow(filtered[nextIdx]);
                }
              }}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-ids-border font-bold rounded cursor-pointer"
            >
              Next
            </button>
            <button
              id="company-lookup-select-btn"
              disabled={!selectedRow}
              onClick={handleSelectConfirm}
              className={`px-4 py-1.5 font-bold rounded cursor-pointer text-white transition-colors ${
                selectedRow
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-300 cursor-not-allowed opacity-50"
              }`}
            >
              Select
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompanyLookup;
