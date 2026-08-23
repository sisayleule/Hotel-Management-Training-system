import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { toast } from "react-hot-toast";
import { useHotelStore } from "../../store/useHotelStore";

const TableSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tempOrder = useHotelStore((state) => state.tempOrder);
  const outletId = searchParams.get("outlet");
  const restaurantId = searchParams.get("restaurant");
  
  // Use tempOrder's table if we're adding more items, otherwise null
  const preselectedTable = tempOrder.table;

  // Parameter validation guard
  React.useEffect(() => {
    // outletId is ALWAYS required
    if (!outletId || outletId === "null") {
      toast.error("Please select outlet first", {
        duration: 3000,
        position: "top-center"
      });
      navigate("/waiter/select-outlet");
      return;
    }

    // restaurantId is ONLY required when outlet === "restaurant"
    if (outletId === "restaurant" && (!restaurantId || restaurantId === "null")) {
      toast.error("Please select restaurant first", {
        duration: 3000,
        position: "top-center"
      });
      navigate(`/waiter/select-restaurant?outlet=${outletId}`);
    }
  }, [outletId, restaurantId, navigate]);

  const tables = Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    status: "available" // All available in Phase 1
  }));

  const handleTableSelect = (tableNumber) => {
    // If we have a preselected table, verify it matches
    if (preselectedTable && preselectedTable !== String(tableNumber)) {
      toast.error(`Current order is for table ${preselectedTable}. Please select table ${preselectedTable}.`, {
        duration: 4000,
        position: "top-center"
      });
      return;
    }
    
    // Build URL with appropriate params based on outlet type
    if (outletId === "restaurant") {
      navigate(`/waiter/menu?outlet=${outletId}&restaurant=${restaurantId}&table=${tableNumber}`);
    } else {
      // Bar or Room Service: no restaurant param
      navigate(`/waiter/menu?outlet=${outletId}&table=${tableNumber}`);
    }
  };

  const handleBack = () => {
    if (outletId === "restaurant") {
      navigate(`/waiter/select-restaurant?outlet=${outletId}`);
    } else {
      navigate("/waiter/select-outlet");
    }
  };

  const handleLogout = () => {
    navigate("/app/waiter");
  };

  // Conditional breadcrumb
  const getBreadcrumb = () => {
    if (outletId === "restaurant") {
      return "Outlet > Restaurant > Table";
    } else {
      return "Outlet > Table";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-semibold">BACK</span>
              </button>
              <h1 className="text-2xl font-bold" style={{ color: "#ff8c42" }}>
                SELECT TABLE
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Return to F&B dashboard"
            >
              <LogOut size={18} />
              <span className="font-semibold text-sm">LOGOUT</span>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{getBreadcrumb()}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {tables.map((table) => {
            const isPreselected = preselectedTable && String(table.number) === String(preselectedTable);
            return (
              <button
                key={table.number}
                onClick={() => handleTableSelect(table.number)}
                className={`aspect-square p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center ${
                  isPreselected ? "ring-4 ring-orange-500" : ""
                }`}
                style={{ backgroundColor: "#1a5c5c" }}
              >
                <span className="text-3xl font-bold text-white">
                  {table.number}
                  {isPreselected && <span className="block text-xs mt-1">CURRENT</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TableSelection;
