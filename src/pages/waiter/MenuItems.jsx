import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useHotelStore } from "../../store/useHotelStore";
import { toast } from "react-hot-toast";
import { getMenuData } from "../../data/menuData";
import CategorySidebar from "../../components/waiter/CategorySidebar";
import MenuItemsTable from "../../components/waiter/MenuItemsTable";
import CurrentOrderPanel from "../../components/waiter/CurrentOrderPanel";
import ByBillView from "../../components/waiter/ByBillView";
import ByDescriptionView from "../../components/waiter/ByDescriptionView";
import Modal from "../../components/ui/Modal";

const MenuItems = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const submitOrder = useHotelStore((state) => state.submitOrder);
  const setTempOrder = useHotelStore((state) => state.setTempOrder);
  const clearTempOrder = useHotelStore((state) => state.clearTempOrder);
  const tempOrder = useHotelStore((state) => state.tempOrder);
  const outletId = searchParams.get("outlet");
  const restaurantId = searchParams.get("restaurant");
  const table = searchParams.get("table");

  // Get menu data based on outlet/restaurant
  const menuData = getMenuData(outletId, restaurantId);

  // Parameter validation guard with conditional logic
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
    if (outletId === "restaurant") {
      if (!restaurantId || restaurantId === "null" || !menuData) {
        toast.error("Please select restaurant first", {
          duration: 3000,
          position: "top-center"
        });
        navigate(`/waiter/select-restaurant?outlet=${outletId}`);
        return;
      }
    }

    // For bar/room_service, missing restaurantId is expected and valid
    // Check if we got valid menu data for the outlet
    if ((outletId === "bar" || outletId === "room_service") && !menuData) {
      toast.error("Invalid outlet configuration", {
        duration: 3000,
        position: "top-center"
      });
      navigate("/waiter/select-outlet");
    }
  }, [outletId, restaurantId, menuData, navigate]);

  // State management
  const [selectedCategory, setSelectedCategory] = useState(
    menuData?.categories[0]?.id || ""
  );
  const [currentOrder, setCurrentOrder] = useState(tempOrder.items || []);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [viewMode, setViewMode] = useState("menu"); // "menu" | "byBill" | "byDescription"
  
  // Sync currentOrder with tempOrder when component mounts or when returning from another outlet
  React.useEffect(() => {
    if (tempOrder.items && tempOrder.items.length > 0) {
      setCurrentOrder(tempOrder.items);
    }
  }, [tempOrder.items]);

  // If no menu data, don't render
  if (!menuData) {
    return null;
  }

  const displayName = menuData.name;
  
  // Format outlet name for display
  const formatOutletName = (id) => {
    if (!id) return "Unknown";
    return id.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  // Add item to order
  const handleAddItem = (item) => {
    const existingItem = currentOrder.find(orderItem => 
      orderItem.id === item.id && 
      orderItem.outlet === outletId && 
      orderItem.restaurant === restaurantId
    );
    
    if (existingItem) {
      // Increment quantity
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.id === item.id && 
        orderItem.outlet === outletId && 
        orderItem.restaurant === restaurantId
          ? { 
              ...orderItem, 
              quantity: orderItem.quantity + 1, 
              lineTotal: (orderItem.quantity + 1) * orderItem.unitPrice 
            }
          : orderItem
      ));
    } else {
      // Add new item with outlet/restaurant source
      setCurrentOrder([...currentOrder, {
        id: item.id,
        name: item.name,
        category: item.category,
        outlet: outletId,
        restaurant: restaurantId || null,
        unitPrice: item.price,
        quantity: 1,
        isComplimentary: false,
        lineTotal: item.price,
        entrySequence: currentOrder.length + 1
      }]);
    }
  };

  // Calculate total (excluding complimentary items)
  const calculateTotal = () => {
    return currentOrder.reduce((sum, item) => {
      return sum + (item.isComplimentary ? 0 : item.lineTotal);
    }, 0);
  };
  
  // Calculate tax and service charge
  const calculateCharges = () => {
    const subtotal = calculateTotal();
    const serviceCharge = subtotal * 0.10; // 10%
    const tax = subtotal * 0.15; // 15%
    const grandTotal = subtotal + serviceCharge + tax;
    
    return {
      subtotal,
      serviceCharge,
      tax,
      grandTotal
    };
  };

  // Increase quantity handler
  const handleIncreaseQuantity = (itemId) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.id === itemId && item.quantity < 99) {
        const newQuantity = item.quantity + 1;
        return {
          ...item,
          quantity: newQuantity,
          lineTotal: item.isComplimentary ? 0 : newQuantity * item.unitPrice
        };
      }
      return item;
    }));
  };

  // Decrease quantity handler
  const handleDecreaseQuantity = (itemId) => {
    const item = currentOrder.find(i => i.id === itemId);
    if (item.quantity === 1) {
      // Remove item if quantity is 1
      setCurrentOrder(currentOrder.filter(i => i.id !== itemId));
    } else {
      setCurrentOrder(currentOrder.map(i => {
        if (i.id === itemId) {
          const newQuantity = i.quantity - 1;
          return {
            ...i,
            quantity: newQuantity,
            lineTotal: i.isComplimentary ? 0 : newQuantity * i.unitPrice
          };
        }
        return i;
      }));
    }
  };

  // Toggle complimentary handler
  const handleToggleComplimentary = (itemId) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.id === itemId) {
        const newIsComp = !item.isComplimentary;
        return {
          ...item,
          isComplimentary: newIsComp,
          lineTotal: newIsComp ? 0 : item.quantity * item.unitPrice
        };
      }
      return item;
    }));
  };

  // Delete item handler
  const handleDeleteItem = (itemId) => {
    setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
  };

  // MENU button handler - always navigate to outlet selection to start new order
  const handleMenuClick = () => {
    if (currentOrder.length > 0) {
      // If there's an active order, show confirmation
      if (window.confirm("Current order will be lost. Start a new order?")) {
        setCurrentOrder([]);
        navigate("/waiter/select-outlet");
      }
    } else {
      // No active order, navigate directly
      navigate("/waiter/select-outlet");
    }
  };

  // VIEW ORDER button handler
  const handleViewOrder = () => {
    setViewMode("byBill");
  };

  // Handle submit order
  const handleSubmitOrder = () => {
    if (currentOrder.length === 0) return;

    const charges = calculateCharges();
    const { subtotal, serviceCharge, tax, grandTotal } = charges;

    // Group items by outlet/restaurant for display purposes
    const outlets = [...new Set(currentOrder.map(item => item.outlet))];
    const restaurants = [...new Set(currentOrder.filter(item => item.restaurant).map(item => item.restaurant))];

    const orderData = {
      outlet: outlets.length === 1 ? outlets[0] : "multiple", // Mark as multiple if more than one
      restaurant: restaurants.length === 1 ? restaurants[0] : (restaurants.length > 0 ? "multiple" : null),
      table: table,
      items: currentOrder,
      subtotal,
      serviceCharge,
      tax,
      grandTotal
    };

    const result = submitOrder(orderData);
    
    // Get the order number from the store
    const orders = useHotelStore.getState().orders;
    const lastOrder = orders[orders.length - 1];
    const orderNo = lastOrder.orderNo;

    // Log order data for verification
    console.log("Order submitted:", lastOrder);

    // Show detailed success message
    toast.success(
      `Order ${orderNo} submitted successfully!\nTable: ${table}\nTotal: ₹${grandTotal.toFixed(2)}`,
      {
        duration: 5000,
        position: "top-center",
        style: {
          minWidth: "300px",
          whiteSpace: "pre-line"
        }
      }
    );

    // Clear order and temp order
    setCurrentOrder([]);
    clearTempOrder();
    setViewMode("menu");
    navigate("/waiter");
  };

  const canSubmit = currentOrder.length > 0;
  
  // ADD MORE ITEMS button handler - save current order and go to outlet selection
  const handleAddMoreItems = () => {
    // Save current order to tempOrder
    setTempOrder(table, currentOrder);
    // Navigate to outlet selection
    navigate("/waiter/select-outlet");
  };

  // RES button handler
  const handleRESClick = () => {
    if (currentOrder.length > 0) {
      setShowConfirmDialog(true);
    } else {
      // Navigate back to table selection with appropriate params
      if (outletId === "restaurant") {
        navigate(`/waiter/select-table?outlet=${outletId}&restaurant=${restaurantId}`);
      } else {
        navigate(`/waiter/select-table?outlet=${outletId}`);
      }
    }
  };

  const handleConfirmRES = () => {
    setCurrentOrder([]);
    setShowConfirmDialog(false);
    // Navigate back to table selection with appropriate params
    if (outletId === "restaurant") {
      navigate(`/waiter/select-table?outlet=${outletId}&restaurant=${restaurantId}`);
    } else {
      navigate(`/waiter/select-table?outlet=${outletId}`);
    }
  };

  const handleCancelRES = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2 gap-4">
            <h1 className="text-2xl font-bold" style={{ color: "#ff8c42" }}>
              ORDER FOR TABLE {table}
            </h1>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleMenuClick}
                className="px-4 py-2 rounded-lg font-bold uppercase text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#1a5c5c" }}
              >
                MENU
              </button>
              <button
                onClick={handleViewOrder}
                className="px-4 py-2 rounded-lg font-bold uppercase text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#1a5c5c" }}
                disabled={currentOrder.length === 0}
              >
                REVIEW
              </button>
              <button
                onClick={handleRESClick}
                className="px-4 py-2 rounded-lg font-bold uppercase text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#1a5c5c" }}
              >
                RES
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold">OUTLET:</span> {formatOutletName(outletId)}
            {outletId === "restaurant" && restaurantId && (
              <>
                {" | "}
                <span className="font-semibold">RESTAURANT:</span> {displayName}
              </>
            )}
            {" | "}
            <span className="font-semibold">TABLE:</span> {table}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "menu" ? (
        /* 3-panel layout for menu */
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Category Sidebar */}
            <div className="lg:col-span-2">
              <CategorySidebar 
                categories={menuData.categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
            </div>

            {/* Center: Menu Items Table */}
            <div className="lg:col-span-6">
              <MenuItemsTable
                items={menuData.items}
                selectedCategory={selectedCategory}
                onAddItem={handleAddItem}
              />
            </div>

            {/* Right: Current Order Panel */}
            <div className="lg:col-span-4">
              <CurrentOrderPanel
                currentOrder={currentOrder}
                calculateTotal={calculateTotal}
                onIncreaseQuantity={handleIncreaseQuantity}
                onDecreaseQuantity={handleDecreaseQuantity}
                onToggleComplimentary={handleToggleComplimentary}
                onDeleteItem={handleDeleteItem}
                onAddMoreItems={handleAddMoreItems}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Order Review Views */
        <div className="max-w-5xl mx-auto p-6">
          {/* View Tabs */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setViewMode("byBill")}
              className={`px-6 py-3 rounded-t-lg font-bold uppercase transition-colors ${
                viewMode === "byBill"
                  ? "text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              style={viewMode === "byBill" ? { backgroundColor: "#ff8c42" } : {}}
            >
              BY BILL
            </button>
            <button
              onClick={() => setViewMode("byDescription")}
              className={`px-6 py-3 rounded-t-lg font-bold uppercase transition-colors ${
                viewMode === "byDescription"
                  ? "text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              style={viewMode === "byDescription" ? { backgroundColor: "#ff8c42" } : {}}
            >
              BY DESCRIPTION
            </button>
          </div>

          {/* View Content */}
          {viewMode === "byBill" ? (
            <ByBillView
              currentOrder={currentOrder}
              onBackToMenu={() => setViewMode("menu")}
              onSubmit={handleSubmitOrder}
              canSubmit={canSubmit}
            />
          ) : (
            <ByDescriptionView
              currentOrder={currentOrder}
              onBackToMenu={() => setViewMode("menu")}
              onSubmit={handleSubmitOrder}
              canSubmit={canSubmit}
            />
          )}
        </div>
      )}

      {/* RES Confirmation Dialog */}
      {showConfirmDialog && (
        <Modal
          isOpen={showConfirmDialog}
          onClose={handleCancelRES}
          title="⚠️ WARNING"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Current order will be lost. Continue to table selection?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelRES}
                className="px-4 py-2 rounded-lg font-bold uppercase text-gray-700 bg-gray-200 hover:bg-gray-300"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmRES}
                className="px-4 py-2 rounded-lg font-bold uppercase text-white"
                style={{ backgroundColor: "#1a5c5c" }}
              >
                YES, CONTINUE
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MenuItems;
