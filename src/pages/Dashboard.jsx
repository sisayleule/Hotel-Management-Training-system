import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Grid,
  Calendar,
  LogIn,
  LogOut,
  Wallet,
  Sparkles,
  BarChart3,
  Settings,
  Phone,
  DollarSign,
  Package,
  Utensils,
  Shirt,
  Info,
  Clock,
  Play,
  ShieldAlert
} from "lucide-react";
import { useHotelStore } from "../store/useHotelStore.js";
import { useAuth } from "../hooks/useAuth.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import Modal from "../components/ui/Modal.jsx";
import toast from "react-hot-toast";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getDashboardStats, selectedDate } = useHotelStore();
  const [isDayEndOpen, setIsDayEndOpen] = useState(false);
  const [dayEndStep, setDayEndStep] = useState(0); // 0=start, 1=running, 2=complete

  const stats = getDashboardStats();

  // Top icon toolbar items
  const toolbarItems = [
    { label: "Front Office", icon: LogIn, path: "/app/checkin" },
    { label: "Cashiering", icon: Wallet, path: "/app/cashiering" },
    { label: "Reports", icon: BarChart3, path: "/app/reports" },
    { label: "Housekeeping", icon: Sparkles, path: "/app/housekeeping" },
    { label: "Reservations", icon: Calendar, path: "/app/reservations" },
    { label: "Phone", icon: Phone, action: () => toast.success("PBX Link Status: Active") },
    { label: "Revenue", icon: DollarSign, action: () => toast.info("Revenue management module: Phase 3 Upgrade") },
    { label: "Packages", icon: Package, action: () => toast.info("Package Plans & Rates Grid is Active") },
    { label: "Restaurant", icon: Utensils, action: () => toast.info("POS Restaurant module: Available at F&B outlet") },
    { label: "Laundry", icon: Shirt, action: () => toast.info("Linen & Guest Laundry Tracker is active") },
    { label: "Settings", icon: Settings, path: "/app/settings" }
  ];

  // Left menu items
  const menuItems = [
    { name: "Registrations..", path: "/app/checkin", desc: "Manage guest registration cards and check-ins" },
    { name: "Reservations..", path: "/app/reservations", desc: "Create, search, or cancel bookings" },
    { name: "Cashiering..", path: "/app/cashiering", desc: "Settle bills, post transactions, print folios" },
    {
      name: "Day End process..",
      action: () => {
        setDayEndStep(0);
        setIsDayEndOpen(true);
      },
      desc: "Run Night Audit and advance system date"
    },
    { name: "Guest History..", path: "/app/settings", desc: "Review historic guest listings" },
    { name: "House Keeping..", path: "/app/housekeeping", desc: "Update room clean/dirty states" },
    { name: "Reports..", path: "/app/reports", desc: "General manager and night audit reports" },
    { name: "Lookups..", path: "/app/rooms", desc: "Examine physical room status charts" },
    { name: "SMS Setup..", action: () => toast.success("EthioTelecom SMS Gateway connection: Ok"), desc: "Automatic booking confirmations" },
    { name: "Setup..", path: "/app/settings", desc: "General hotel configuration and rates" }
  ];

  const runDayEnd = () => {
    setDayEndStep(1);
    toast.loading("Running night audit routines...", { id: "audit" });

    setTimeout(() => {
      setDayEndStep(2);
      toast.success("Night audit succeeded! Date advanced to 01-Jul-2026", { id: "audit" });
    }, 2500);
  };

  return (
    <PageWrapper>
      {/* IDS Next Header Row */}
      <div id="ids-header-row" className="bg-ids-header text-white flex items-center justify-between px-4 py-2 border border-ids-border text-xs font-mono select-none shadow-sm rounded-t mb-4">
        <div>
          BS/GN V[6.5] &nbsp;&nbsp; SP V[1] &nbsp;&nbsp; USER: <span className="font-bold text-yellow-300">{currentUser?.full_name || currentUser?.name || "USER"}</span>
        </div>
        <div className="hidden sm:block font-bold">
          AMOB UNIVERSITY FORTUNE TRAINING HOTEL
        </div>
      </div>

      {/* Top toolbar (horizontal scroll on mobile) */}
      <div
        id="top-icon-toolbar"
        className="bg-white border border-ids-border p-3 rounded mb-6 shadow-xs flex items-center space-x-3 overflow-x-auto scrollbar-none select-none shrink-0"
      >
        {toolbarItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              id={`toolbar-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => (item.path ? navigate(item.path) : item.action())}
              className="flex flex-col items-center justify-center p-2 rounded hover:bg-ids-bg border border-transparent hover:border-ids-border/40 transition-all text-center min-w-[76px]"
            >
              <div className="p-2 bg-ids-bg border border-ids-border/30 rounded text-ids-sidebar mb-1.5 shadow-2xs">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-gray-700 tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section split (Front Office Left / Statistics Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none items-start">
        {/* Left Side Menu Board (4 columns on lg) */}
        <div className="lg:col-span-4 bg-white border border-ids-border rounded overflow-hidden shadow-xs">
          <div className="bg-ids-sidebar text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wider font-sans border-b border-ids-border">
            Front Office Menu
          </div>
          <div className="divide-y divide-ids-border">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                id={`menu-item-${item.name.toLowerCase().replace(/[^a-z]/g, "")}`}
                onClick={() => (item.path ? navigate(item.path) : item.action())}
                className="w-full text-left px-4 py-3 hover:bg-ids-bg/50 transition-colors flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-bold text-ids-sidebar font-sans group-hover:text-ids-header transition-colors">
                    {item.name}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.desc}</p>
                </div>
                <div className="text-ids-border group-hover:text-ids-header transition-colors text-xs font-mono">
                  &gt;&gt;
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side Stats Grid (8 columns on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-ids-sidebar text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wider font-sans border border-ids-border rounded-t flex items-center justify-between">
            <span>PMS Statistics Board</span>
            <span className="text-[10px] font-mono lowercase text-ids-sidebar-text">Live synchronized</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            <StatCard
              title="Expected Arrivals"
              value={stats.expectedArrivals}
              icon={LogIn}
              onClick={() => navigate("/app/checkin")}
            />
            <StatCard
              title="Expected Departures"
              value={stats.expectedDepartures}
              icon={LogOut}
              onClick={() => navigate("/app/checkout")}
            />
            <StatCard
              title="Walk-in Rooms"
              value={stats.walkInRooms}
              icon={Users}
              onClick={() => navigate("/app/reservations/new")}
            />
            <StatCard
              title="Rooms to Sell"
              value={stats.roomsToSell}
              icon={Grid}
              onClick={() => navigate("/app/rooms")}
            />
            <StatCard
              title="Inhouse Rooms / Guests"
              value={`${stats.inhouseRooms} / ${stats.inhouseGuests}`}
              icon={Users}
              onClick={() => navigate("/app/reservations")}
            />
            <StatCard
              title="Extra Adult / Child"
              value={stats.extraAdultChild}
              icon={Info}
              onClick={() => navigate("/app/reservations")}
            />
            <StatCard
              title="Inhouse Foreign"
              value={stats.inhouseForeignGuests}
              icon={Info}
              onClick={() => navigate("/app/reservations")}
            />
            <StatCard
              title="Blocked / OOD Rooms"
              value={stats.guestBlock}
              icon={Clock}
              onClick={() => navigate("/app/housekeeping")}
            />
            <StatCard
              title="Registered Complaints"
              value={stats.registeredComplaints}
              icon={ShieldAlert}
              onClick={() => toast.info("Review pending maintenance flags in Settings.")}
              className="col-span-2"
            />
          </div>
        </div>
      </div>

      {/* Day End night audit process modal */}
      <Modal
        isOpen={isDayEndOpen}
        onClose={() => setIsDayEndOpen(false)}
        title="IDS Next Night Audit Simulator"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 text-center">
          <Clock className="w-12 h-12 text-ids-header mx-auto animate-pulse" />
          <h4 className="font-bold text-sm text-gray-800">Close Out Shift & Post Charges</h4>
          <p className="text-xs text-gray-500">
            This advances the system operational calendar, posts nightly room rate charges to all active folios, and clears day logs.
          </p>

          {dayEndStep === 0 && (
            <div className="pt-2">
              <button
                id="btn-confirm-day-end"
                onClick={runDayEnd}
                className="w-full py-2 bg-ids-header text-white font-bold text-xs rounded hover:bg-ids-sidebar transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Confirm Run Night Audit</span>
              </button>
            </div>
          )}

          {dayEndStep === 1 && (
            <div className="py-4 space-y-2">
              <div className="relative w-full h-2 bg-gray-100 rounded overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-orange-500 w-1/2 animate-shimmer rounded"></div>
              </div>
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider animate-pulse">Processing folios...</p>
            </div>
          )}

          {dayEndStep === 2 && (
            <div className="pt-2 space-y-3">
              <div className="p-2.5 bg-green-50 border border-green-200 rounded text-left">
                <p className="text-xs font-bold text-green-800">Process Complete!</p>
                <ul className="text-[10px] text-green-700 list-disc pl-4 mt-1 space-y-0.5 font-sans">
                  <li>60 room statuses audited.</li>
                  <li>14 active in-house reservations posted.</li>
                  <li>System operational date changed to 01-Jul-2026.</li>
                </ul>
              </div>
              <button
                id="btn-close-day-end"
                onClick={() => setIsDayEndOpen(false)}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded transition-colors"
              >
                Close Audit Dialog
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Bottom IDS action status bar */}
      <div
        id="bottom-action-toolbar"
        className="bg-ids-sidebar text-ids-sidebar-text border border-ids-border p-2.5 rounded mt-6 shadow-xs flex items-center justify-between text-[10px] font-mono select-none overflow-x-auto whitespace-nowrap scrollbar-none"
      >
        <div className="flex items-center space-x-3">
          <span className="hover:text-white cursor-pointer px-1.5 py-0.5 hover:bg-ids-sidebar-hover rounded">F1: Sys Update</span>
          <span className="hover:text-white cursor-pointer px-1.5 py-0.5 hover:bg-ids-sidebar-hover rounded">F2: HotKey</span>
          <span className="hover:text-white cursor-pointer px-1.5 py-0.5 hover:bg-ids-sidebar-hover rounded">F5: Walk-In</span>
          <span className="hover:text-white cursor-pointer px-1.5 py-0.5 hover:bg-ids-sidebar-hover rounded">F9: Search</span>
          <span className="hover:text-white cursor-pointer px-1.5 py-0.5 hover:bg-ids-sidebar-hover rounded">F12: To-Do</span>
        </div>
        <div className="text-right font-bold text-room-vacant">
          LST UPDT: 30-JUN-2026 13:10
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
