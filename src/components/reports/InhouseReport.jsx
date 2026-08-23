import React, { useState } from "react";
import { ArrowLeft, Printer, FileText, RefreshCw, Star } from "lucide-react";
import { useHotelStore } from "../../store/useHotelStore.js";
import { formatCurrency } from "../../utils/formatters.js";
import toast from "react-hot-toast";

export const InhouseReport = ({ onBack }) => {
  const selectedDate = useHotelStore((state) => state.selectedDate);
  const reservations = useHotelStore((state) => state.reservations);
  const rooms = useHotelStore((state) => state.rooms);

  const [floorFilter, setFloorFilter] = useState("All");
  const [roomTypeFilter, setRoomTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Room");

  // Filter inhouse reservations (status checked_in)
  const inhouseList = reservations.filter((res) => {
    if (res.status !== "checked_in") return false;

    // Retrieve room object to filter by floor
    const assignedRoomNo = res.rooms_assigned && res.rooms_assigned[0];
    const roomObj = rooms.find((r) => r.room_no === assignedRoomNo);

    if (floorFilter !== "All" && roomObj?.floor !== Number(floorFilter)) return false;
    if (roomTypeFilter !== "All" && res.room_type !== roomTypeFilter) return false;

    return true;
  });

  // Sort
  const sortedInhouse = [...inhouseList].sort((a, b) => {
    if (sortBy === "Room") {
      const roomA = a.rooms_assigned?.[0] || "";
      const roomB = b.rooms_assigned?.[0] || "";
      return roomA.localeCompare(roomB);
    } else if (sortBy === "Guest") {
      return a.guest_name.localeCompare(b.guest_name);
    } else if (sortBy === "Departure") {
      return a.departure.localeCompare(b.departure);
    }
    return 0;
  });

  // Statistics
  const totalInhouseRooms = inhouseList.length;
  const totalInhouseGuests = inhouseList.reduce((sum, r) => sum + r.adults + r.children, 0);
  const totalOutstanding = inhouseList.reduce((sum, r) => {
    const totalPayments = (r.payments || []).reduce((s, p) => s + p.amount, 0);
    return sum + (r.total_amount - totalPayments);
  }, 0);
  
  const occupancyRate = Math.round((totalInhouseRooms / rooms.length) * 100);

  const handlePrint = () => {
    toast.success("Printing In-House Guest List...");
    window.print();
  };

  const handleCSV = () => {
    toast.success("Exported In-House Guest ledger as CSV.");
  };

  return (
    <div className="space-y-6 font-sans select-none text-xs text-gray-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ids-border">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 border border-ids-border rounded bg-white hover:bg-gray-100 transition-all text-gray-600"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider">
              In-House Guest Registry List
            </h2>
            <p className="text-[10px] text-gray-500 font-mono">
              Complete catalog of guests currently resident on site
            </p>
          </div>
        </div>

        <div className="flex space-x-2 shrink-0">
          <button
            onClick={handleCSV}
            className="px-3 py-1.5 bg-white border border-ids-border hover:bg-gray-50 rounded font-bold flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white rounded font-bold flex items-center space-x-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Folio</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-ids-border rounded-lg p-4 shadow-3xs grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Floor Level</label>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-bold"
          >
            <option value="All">All Floors</option>
            <option value="2">2nd Floor</option>
            <option value="3">3rd Floor</option>
            <option value="4">4th Floor</option>
            <option value="5">5th Floor</option>
            <option value="6">6th Floor</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Room Category</label>
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-bold"
          >
            <option value="All">All Categories</option>
            <option value="DLX">D/DLX - Deluxe</option>
            <option value="EXE">D/EXE - Executive</option>
            <option value="SUI">V/SUI - Suite</option>
            <option value="PNH">D/PNH - Penthouse</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Sort By Parameters</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full p-1.5 border border-ids-border rounded text-xs bg-white text-gray-700 font-bold"
          >
            <option value="Room">Room Number</option>
            <option value="Guest">Guest Name</option>
            <option value="Departure">Departure Date</option>
          </select>
        </div>
        <button
          onClick={() => toast.success("In-house registry refreshed.")}
          className="bg-slate-800 hover:bg-slate-950 text-white font-bold py-1.5 rounded flex items-center justify-center space-x-1 h-[32px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Generate</span>
        </button>
      </div>

      {/* Report Table */}
      <div className="bg-white border border-ids-border rounded-lg overflow-hidden shadow-xs overflow-x-auto p-4 space-y-6">
        
        <table className="w-full text-left border-collapse text-xs min-w-[800px]">
          <thead className="bg-slate-100 text-gray-700 font-bold border-b border-ids-border text-[10px] uppercase tracking-wider font-mono">
            <tr>
              <th className="px-3 py-2.5 text-center">Room</th>
              <th className="px-3 py-2.5">Guest Name</th>
              <th className="px-3 py-2.5">Company Code</th>
              <th className="px-3 py-2.5">Check-in Date</th>
              <th className="px-3 py-2.5">Expected Departure</th>
              <th className="px-3 py-2.5 text-center">Nights</th>
              <th className="px-3 py-2.5">Category</th>
              <th className="px-3 py-2.5 text-right">Charges</th>
              <th className="px-3 py-2.5 text-right">Payments</th>
              <th className="px-3 py-2.5 text-right">Balance Due</th>
              <th className="px-3 py-2.5 text-center">VIP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ids-border/40 font-mono text-gray-600">
            {sortedInhouse.length > 0 ? (
              sortedInhouse.map((res) => {
                const totalPayments = (res.payments || []).reduce((sum, p) => sum + p.amount, 0);
                const balance = res.total_amount - totalPayments;
                const isVip = res.total_amount > 10000;

                return (
                  <tr key={res.reservation_no} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 text-center font-bold text-orange-600">
                      Room {res.rooms_assigned && res.rooms_assigned.length > 0 ? res.rooms_assigned.join(", ") : "Unassigned"}
                    </td>
                    <td className="px-3 py-2.5 font-sans font-bold text-gray-800">{res.guest_name}</td>
                    <td className="px-3 py-2.5">{res.company_code || <span className="text-gray-400 font-normal">--</span>}</td>
                    <td className="px-3 py-2.5 text-slate-500">{res.arrival}</td>
                    <td className="px-3 py-2.5 text-slate-500">{res.departure}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-700">{res.nights}</td>
                    <td className="px-3 py-2.5 font-sans">{res.room_type}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{formatCurrency(res.total_amount)}</td>
                    <td className="px-3 py-2.5 text-right text-green-600">-{formatCurrency(totalPayments)}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {isVip ? (
                        <span className="inline-flex items-center justify-center text-amber-500" title="High Billings Premium Guest">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="p-8 text-center text-gray-400 italic">
                  No active in-house guests match your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Dynamic Summary Cards Block */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100 font-mono text-slate-700 font-bold">
          <div className="bg-slate-50 border border-ids-border/50 rounded p-3 text-center">
            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Inhouse Rooms</span>
            <span className="text-lg text-slate-800">{totalInhouseRooms} Keys</span>
          </div>
          <div className="bg-slate-50 border border-ids-border/50 rounded p-3 text-center">
            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Total Residents</span>
            <span className="text-lg text-slate-800">{totalInhouseGuests} Pax</span>
          </div>
          <div className="bg-slate-50 border border-ids-border/50 rounded p-3 text-center">
            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Total Outstanding</span>
            <span className="text-lg text-red-600">{formatCurrency(totalOutstanding)}</span>
          </div>
          <div className="bg-slate-50 border border-ids-border/50 rounded p-3 text-center">
            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Occupancy Rate</span>
            <span className="text-lg text-green-700">{occupancyRate}%</span>
          </div>
        </div>

      </div>

      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-ids-border rounded font-bold text-gray-600 hover:bg-gray-50 transition-all bg-white"
        >
          Back to Reports Hub
        </button>
      </div>

    </div>
  );
};

export default InhouseReport;
