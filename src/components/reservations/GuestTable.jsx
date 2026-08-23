import React from "react";
import { UserPlus, Trash2, Search } from "lucide-react";

/**
 * @param {Object} props
 * @param {Array} props.guests
 * @param {function(Array): void} props.setGuests
 * @param {function(number): void} props.onTriggerLookup
 */
export const GuestTable = ({ guests, setGuests, onTriggerLookup }) => {
  const handleCellChange = (index, field, value) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [field]: value };
    setGuests(updated);
  };

  const handleAddRow = () => {
    setGuests([...guests, { title: "Mr", last_name: "", middle_name: "", first_name: "" }]);
  };

  const handleRemoveRow = (index) => {
    if (guests.length <= 1) {
      // Keep at least one row
      setGuests([{ title: "Mr", last_name: "", middle_name: "", first_name: "" }]);
    } else {
      setGuests(guests.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-2 select-none text-xs font-sans text-gray-800">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
          <span>Guest Registration Grid</span>
        </span>
        <button
          type="button"
          onClick={handleAddRow}
          className="px-2.5 py-1 bg-ids-sidebar text-white hover:bg-ids-sidebar-hover text-[10px] font-bold uppercase rounded flex items-center space-x-1 cursor-pointer transition-colors"
        >
          <UserPlus className="w-3 h-3" />
          <span>+ Add Row</span>
        </button>
      </div>

      <div className="bg-white border border-ids-border rounded-lg overflow-hidden shadow-3xs overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-50 border-b border-ids-border/60 text-[9px] font-black uppercase text-gray-400 tracking-wider">
              <th className="px-3 py-2 w-16">Title</th>
              <th className="px-3 py-2">Last Name</th>
              <th className="px-3 py-2 w-24">Middle Name</th>
              <th className="px-3 py-2">First Name</th>
              <th className="px-3 py-2 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ids-border/30">
            {guests.map((g, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                {/* Title selection */}
                <td className="px-2 py-1.5">
                  <select
                    value={g.title || "Mr"}
                    onChange={(e) => handleCellChange(idx, "title", e.target.value)}
                    className="w-full bg-transparent border-0 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                </td>

                {/* Last Name Input */}
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={g.last_name || ""}
                    onChange={(e) => handleCellChange(idx, "last_name", e.target.value)}
                    placeholder="Type Last Name..."
                    className="w-full bg-transparent border-0 font-bold text-ids-sidebar focus:outline-none"
                  />
                </td>

                {/* Middle Name Input */}
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={g.middle_name || ""}
                    onChange={(e) => handleCellChange(idx, "middle_name", e.target.value)}
                    placeholder="—"
                    className="w-full bg-transparent border-0 font-medium text-gray-600 focus:outline-none text-center"
                  />
                </td>

                {/* First Name Input */}
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={g.first_name || ""}
                    onChange={(e) => handleCellChange(idx, "first_name", e.target.value)}
                    placeholder="Type First Name..."
                    className="w-full bg-transparent border-0 font-bold text-ids-sidebar focus:outline-none"
                  />
                </td>

                {/* Actions: Lookup and Remove */}
                <td className="px-2 py-1.5 text-center flex items-center justify-center space-x-1">
                  <button
                    type="button"
                    onClick={() => onTriggerLookup(idx)}
                    className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Search Guest Profile History"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestTable;
