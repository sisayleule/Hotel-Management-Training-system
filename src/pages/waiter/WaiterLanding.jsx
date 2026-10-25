import React from "react";
import { useNavigate } from "react-router-dom";
import { useHotelStore } from "../../store/useHotelStore";
import { Coffee, ClipboardList, LogOut } from "lucide-react";
import { toast } from "react-hot-toast";

const WaiterLanding = () => {
  const navigate = useNavigate();
  const currentUser = useHotelStore((state) => state.currentUser);
  
  // Format current date as DD-MMM-YYYY
  const currentDate = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }).toUpperCase();

  const handleTakeOrder = () => {
    navigate("/waiter/select-outlet");
  };

  const handleViewOrders = () => {
    // Phase 1-4: Show toast message
    toast("Feature coming soon - available in Phase 5", {
      icon: "ℹ️",
      duration: 3000
    });
  };

  const handleLogout = () => {
    navigate("/waiter/select-outlet");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#ff8c42" }}>
              F&B POS SYSTEM
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              FORTUNE NEXT HOTEL MANAGEMENT
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Take Order Button */}
            <button
              onClick={handleTakeOrder}
              className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: "#1a5c5c" }}
            >
              <div className="p-12 flex flex-col items-center justify-center text-white">
                <Coffee size={64} className="mb-4" />
                <span className="text-2xl font-bold uppercase tracking-wide">
                  TAKE ORDER
                </span>
              </div>
            </button>

            {/* View Orders Button */}
            <button
              onClick={handleViewOrders}
              className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: "#1a5c5c" }}
            >
              <div className="p-12 flex flex-col items-center justify-center text-white">
                <ClipboardList size={64} className="mb-4" />
                <span className="text-2xl font-bold uppercase tracking-wide">
                  VIEW ORDERS
                </span>
              </div>
            </button>
          </div>

          {/* Footer Info */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4" style={{ borderTopColor: "#ff8c42" }}>
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="font-semibold text-gray-700">WAITER: </span>
                <span className="text-gray-900">{currentUser?.name || "Unknown"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">DATE: </span>
                <span className="text-gray-900">{currentDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaiterLanding;
