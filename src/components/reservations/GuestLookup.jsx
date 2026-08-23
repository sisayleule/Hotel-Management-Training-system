import React, { useState, useMemo } from "react";
import { useHotelStore } from "../../store/useHotelStore.js";
import { useEnterAsTab } from "../../hooks/useEnterAsTab.js";
import { Search, UserCheck, UserPlus, X } from "lucide-react";

/**
 * GuestLookup Popup Modal
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function(): void} props.onClose
 * @param {function(Object): void} props.onSelect
 */
export const GuestLookup = ({ isOpen, onClose, onSelect }) => {
  const guests = useHotelStore((state) => state.guests);
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

  // Filter guest list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.guest_name?.toLowerCase().includes(q) ||
        g.phone?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.identity_no?.toLowerCase().includes(q) ||
        g.city?.toLowerCase().includes(q)
    );
  }, [guests, search]);

  const handleRowClick = (guest) => {
    setSelectedRow(guest);
  };

  const handleSelectConfirm = () => {
    if (selectedRow) {
      // Split names
      const parts = selectedRow.guest_name.trim().split(/\s+/);
      const lastName = parts[parts.length - 1] || "";
      const firstName = parts.slice(0, parts.length - 1).join(" ") || parts[0];

      onSelect({
        title: selectedRow.title || "Mr",
        last_name: lastName,
        middle_name: "",
        first_name: firstName,
        phone: selectedRow.phone,
        email: selectedRow.email,
        identity_no: selectedRow.identity_no,
        city: selectedRow.city,
        state: selectedRow.state,
        country: selectedRow.country,
      });
      onClose();
    }
  };

  const handleNewGuestConfirm = () => {
    onSelect({
      title: "Mr",
      last_name: "",
      middle_name: "",
      first_name: "",
    });
    onClose();
  };

  return (
    <div
      id="guest-lookup-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
    >
      <div ref={searchContainerRef} className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-lg shadow-xl flex flex-col overflow-hidden text-xs font-sans text-gray-800">
        
        {/* Header bar */}
        <div className="bg-ids-sidebar text-white p-3.5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm font-black tracking-wider uppercase">
              Guest History Search
            </h3>
            <p className="text-[10px] text-white/75 font-semibold mt-0.5">
              Retrieve pre-existing customer profiles to minimize front-desk wait time
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
        <div className="p-3 bg-gray-50 border-b border-ids-border/50 shrink-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="guest-search-field"
              type="text"
              placeholder="Filter profile registry by guest name, telephone, email, city, or passport ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedRow(null);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-ids-border rounded font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-ids-header"
            />
          </div>
        </div>

        {/* Table Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto max-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-[9px] tracking-wider sticky top-0 border-b border-ids-border">
              <tr>
                <th className="px-3.5 py-2.5 w-16">Title</th>
                <th className="px-3.5 py-2.5">First Name & Last Name</th>
                <th className="px-3.5 py-2.5">Phone Number</th>
                <th className="px-3.5 py-2.5">City</th>
                <th className="px-3.5 py-2.5 w-24 text-center">Visits</th>
                <th className="px-3.5 py-2.5 w-28 text-center">Last Stay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ids-border/30">
              {filtered.map((g, idx) => {
                const isSelected = selectedRow?.guest_id === g.guest_id;
                // Parse names
                const parts = g.guest_name.trim().split(/\s+/);
                const lastName = parts[parts.length - 1] || "";
                const firstName = parts.slice(0, parts.length - 1).join(" ") || parts[0];

                return (
                  <tr
                    key={g.guest_id || idx}
                    onClick={() => handleRowClick(g)}
                    className={`cursor-pointer transition-colors text-[11px] sm:h-12 h-14 ${
                      isSelected
                        ? "bg-blue-50 border-y-2 border-blue-200"
                        : "hover:bg-gray-50/50"
                    }`}
                  >
                    <td className="px-3.5 py-2 font-bold text-gray-400">
                      {g.title || "Mr"}
                    </td>
                    <td className="px-3.5 py-2 font-extrabold text-ids-sidebar text-xs">
                      {firstName} <span className="font-black text-ids-header">{lastName.toUpperCase()}</span>
                    </td>
                    <td className="px-3.5 py-2 font-mono text-gray-700 font-semibold">
                      {g.phone || "+91 98450 12345"}
                    </td>
                    <td className="px-3.5 py-2 font-bold text-gray-600">
                      {g.city || "Mumbai"}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-black rounded border border-sky-100">
                        {g.visits || Math.floor(Math.random() * 5) + 1}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-center font-mono font-bold text-gray-400 text-[10px]">
                      {g.last_stay || "12-MAR-2026"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400 font-bold uppercase tracking-widest">
                    No historical matches found in customer archive
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
                SELECTED PROFILE: {selectedRow.guest_name}
              </span>
            ) : (
              "Select a profile or click 'New Guest' for direct insertion"
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleNewGuestConfirm}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded flex items-center space-x-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Guest</span>
            </button>
            <button
              id="guest-lookup-select-btn"
              disabled={!selectedRow}
              onClick={handleSelectConfirm}
              className={`px-4 py-1.5 font-bold rounded cursor-pointer text-white flex items-center space-x-1 transition-colors ${
                selectedRow
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-300 cursor-not-allowed opacity-50"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Select</span>
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

export default GuestLookup;
