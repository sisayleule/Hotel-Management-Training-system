import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const OutletSelection = () => {
  const navigate = useNavigate();

  const outlets = [
    { id: "bar", name: "Bar" },
    { id: "restaurant", name: "Restaurant" },
    { id: "room_service", name: "Room Service" }
  ];

  const handleOutletSelect = (outletId) => {
    if (outletId === "restaurant") {
      // Navigate to restaurant selection
      navigate(`/waiter/select-restaurant?outlet=${outletId}`);
    } else {
      // Bar or Room Service: skip restaurant selection, go directly to table
      navigate(`/waiter/select-table?outlet=${outletId}`);
    }
  };

  const handleBack = () => {
    navigate("/waiter");
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">BACK</span>
            </button>
            <h1 className="text-2xl font-bold" style={{ color: "#ff8c42" }}>
              SELECT OUTLET
            </h1>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Outlet</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-4">
          {outlets.map((outlet) => (
            <button
              key={outlet.id}
              onClick={() => handleOutletSelect(outlet.id)}
              className="w-full p-6 text-left rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              style={{ backgroundColor: "#1a5c5c" }}
            >
              <span className="text-xl font-bold text-white uppercase tracking-wide">
                {outlet.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OutletSelection;
