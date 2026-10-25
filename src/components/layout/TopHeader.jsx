import React, { useState, useEffect } from "react";
import { Bell, Menu, User, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useHotelStore } from "../../store/useHotelStore.js";
import { useRoleStore } from "../../store/useRoleStore.js";
import { formatDateDisplay } from "../../utils/dateUtils.js";
import { RequirePermission } from "../auth/RequirePermission.jsx";
import { PERMISSIONS } from "../../config/rbac.js";

export const TopHeader = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const { selectedDate, resetToDemo } = useHotelStore();
  const getRoleMetadata = useRoleStore((state) => state.getRoleMetadata);
  const roleMetadata = getRoleMetadata();
  const [timeStr, setTimeStr] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Simulated live clock starting at 13:10:00 on June 30, 2026
    let hours = 13;
    let minutes = 10;
    let seconds = 0;

    const timer = setInterval(() => {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
          minutes = 0;
          hours++;
          if (hours >= 24) {
            hours = 0;
          }
        }
      }
      const pad = (n) => String(n).padStart(2, "0");
      setTimeStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Detect scroll to add blur after hero section
    const handleScroll = () => {
      // Add blur when scrolled more than 100px (adjust based on your hero height)
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleReset = () => {
    if (window.confirm("Reset all simulation data to default demo values? Any new changes will be lost.")) {
      resetToDemo();
      window.location.reload();
    }
  };

  return (
    <header
      id="top-header"
      className={`text-ids-header-text h-14 border-b border-ids-border px-4 flex items-center justify-between sticky top-0 z-40 shadow-sm safe-padding-top transition-all duration-300 ${
        isScrolled ? "backdrop-blur-md bg-white/10" : ""
      }`}
    >
      <div className="flex items-center space-x-3">
        <button
          id="toggle-mobile-menu"
          onClick={onMenuClick}
          className="md:hidden hover:bg-ids-sidebar-hover/30 p-1.5 rounded transition-colors text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-sm tracking-wide font-sans md:text-base select-none">
          INNSYNC HOTEL MANAGEMENT TRAINING SYSTEM
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* System Date & Time Display */}
        <div className="hidden sm:flex flex-col items-end text-right mr-2">
          <span className="text-xs font-semibold font-mono tracking-wide">
            {formatDateDisplay(selectedDate)}
          </span>
          <span className="text-[11px] text-ids-sidebar-text font-mono tracking-widest leading-none mt-0.5">
            {timeStr || "13:10:00"}
          </span>
        </div>

        {/* Demo reset button */}
        <RequirePermission permission={PERMISSIONS.SETTINGS_MANAGE}>
          <button
            id="btn-reset-demo"
            onClick={handleReset}
            title="Reset Simulation Data"
            className="hover:bg-ids-sidebar-hover/30 p-1.5 rounded transition-colors text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </RequirePermission>

        {/* User profile identifier */}
        <div className="flex items-center space-x-2 border-l border-white/20 pl-4 h-8">
          <div className="p-1.5 bg-white/10 rounded-full">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold font-sans uppercase leading-none">
              {currentUser?.name || "IT ADMIN"}
            </span>
            <span className="text-[10px] text-ids-sidebar-text font-semibold uppercase tracking-wider leading-none mt-1">
              {roleMetadata?.name || "Manager"}
            </span>
          </div>
          <button
            id="btn-header-logout"
            onClick={logout}
            title="Log Out"
            className="hover:bg-white/10 p-1 rounded transition-colors text-white ml-2"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
