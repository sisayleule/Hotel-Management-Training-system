import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

const RestaurantSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outletId = searchParams.get("outlet");

  // Parameter validation guard - outlet must be present
  React.useEffect(() => {
    if (!outletId || outletId === "null") {
      toast.error("Please select outlet first", {
        duration: 3000,
        position: "top-center"
      });
      navigate("/waiter/select-outlet");
    }
  }, [outletId, navigate]);

  const restaurants = [
    { id: "asia_restaurant", name: "Asia Restaurant" },
    { id: "sila_coffee_shop", name: "Sila Coffee Shop" },
    { id: "traditional_restaurant", name: "Traditional Restaurant" },
    { id: "olympia_restaurant", name: "Olympia Restaurant" }
  ];

  const handleRestaurantSelect = (restaurantId) => {
    navigate(`/waiter/select-table?outlet=${outletId}&restaurant=${restaurantId}`);
  };

  const handleBack = () => {
    navigate("/waiter/select-outlet");
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
              SELECT RESTAURANT
            </h1>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Outlet &gt; Restaurant</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <button
              key={restaurant.id}
              onClick={() => handleRestaurantSelect(restaurant.id)}
              className="w-full p-6 text-left rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              style={{ backgroundColor: "#1a5c5c" }}
            >
              <span className="text-xl font-bold text-white uppercase tracking-wide">
                {restaurant.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantSelection;
