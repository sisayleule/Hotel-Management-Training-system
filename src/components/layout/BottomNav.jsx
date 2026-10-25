import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Grid,
  Calendar,
  LogIn,
  MoreHorizontal,
  Wallet,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";

export const BottomNav = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const primaryTabs = [
    { label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
    { label: "Rooms", path: "/app/rooms", icon: Grid },
    { label: "Reservations", path: "/app/reservations", icon: Calendar },
    { label: "Check-in", path: "/app/checkin", icon: LogIn }
  ];

  const moreItems = [
    { label: "Check Out", path: "/app/checkout", icon: LogOut },
    { label: "Cashiering", path: "/app/cashiering", icon: Wallet },
    { label: "Housekeeping", path: "/app/housekeeping", icon: Sparkles },
    { label: "Reports", path: "/app/reports", icon: BarChart3 },
    { label: "Settings", path: "/app/settings", icon: Settings }
  ];

  const handleMoreClick = (e) => {
    e.preventDefault();
    setIsMoreOpen(true);
  };

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <nav
        id="bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-ids-sidebar text-ids-sidebar-text border-t border-ids-border/30 flex items-center justify-around h-16 z-40 select-none safe-padding-bottom"
      >
        {primaryTabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || (tab.path !== "/" && location.pathname.startsWith(tab.path));

          return (
            <Link
              key={index}
              id={`bottom-tab-${tab.label.toLowerCase()}`}
              to={tab.path}
              className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all ${
                isActive ? "text-white" : "text-ids-sidebar-text/75"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wider">{tab.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          id="bottom-tab-more"
          onClick={handleMoreClick}
          className="flex flex-col items-center justify-center w-16 h-full space-y-1 text-ids-sidebar-text/75 hover:text-white"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-wider">More</span>
        </button>
      </nav>

      {/* More Drawer Slide Up Overlay */}
      {isMoreOpen && (
        <div
          id="more-drawer-overlay"
          className="md:hidden fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-xs"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            id="more-drawer"
            className="bg-ids-sidebar text-ids-sidebar-text w-full max-w-md rounded-t-xl border-t border-ids-border p-4 space-y-4 animate-slide-up pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-ids-border/20 pb-2">
              <span className="font-bold text-sm text-white uppercase tracking-wider">PMS Training Modules</span>
              <button
                id="more-drawer-close"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 hover:bg-ids-sidebar-hover rounded text-ids-sidebar-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={idx}
                    id={`drawer-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    to={item.path}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex flex-col items-center justify-center p-3 rounded border border-ids-border/20 transition-colors ${
                      isActive ? "bg-ids-header text-white" : "hover:bg-ids-sidebar-hover bg-ids-sidebar-hover/30"
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-[10px] font-semibold text-center leading-tight truncate w-full">{item.label}</span>
                  </Link>
                );
              })}

              {/* Logout Button inside drawer */}
              <button
                id="drawer-logout-btn"
                onClick={() => {
                  setIsMoreOpen(false);
                  logout();
                }}
                className="flex flex-col items-center justify-center p-3 rounded border border-red-900/30 bg-red-950/20 text-red-300 hover:bg-red-950/40"
              >
                <LogOut className="w-5 h-5 mb-1.5" />
                <span className="text-[10px] font-semibold text-center leading-tight">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
