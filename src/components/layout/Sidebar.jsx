import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useRoleStore } from "../../store/useRoleStore.js";

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const getNavConfig = useRoleStore((state) => state.getNavConfig);
  
  // Get navigation items for current role
  const { navItems } = getNavConfig();

  return (
    <aside
      id="sidebar"
      className={`bg-ids-sidebar text-ids-sidebar-text flex flex-col justify-between h-[calc(100vh-3.5rem)] border-r border-ids-border transition-all duration-300 relative select-none hidden md:flex shrink-0 ${
        isCollapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Top Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Collapsed Toggle Button */}
        <button
          id="btn-sidebar-collapse"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-2 bg-ids-header border border-ids-border text-white rounded-full p-1 shadow hover:bg-ids-sidebar-hover transition-colors hidden md:block"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Header */}
        {!isCollapsed && (
          <div className="px-6 pb-4 mb-4 border-b border-ids-border/30">
            <div className="flex items-center space-x-3 mb-2">
              <img 
                src="/images/ambo-university-logo.png" 
                alt="Ambo University" 
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white tracking-widest uppercase">InnSync</span>
                <span className="text-[9px] text-ids-sidebar-text tracking-wide uppercase font-semibold">V6.5 Training</span>
              </div>
            </div>
          </div>
        )}

        <nav className="space-y-1 px-3">
          {navItems.map((item, index) => {
            const Icon = LucideIcons[item.icon] || LucideIcons.Circle;
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <Link
                key={index}
                id={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                to={item.path}
                className={`flex items-center rounded py-2 px-3 text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-ids-header text-white shadow-sm"
                    : "hover:bg-ids-sidebar-hover hover:text-white"
                } ${isCollapsed ? "justify-center" : "space-x-3"}`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-ids-sidebar-text/80"}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-ids-border/30">
        <button
          id="sidebar-logout-btn"
          onClick={logout}
          className={`w-full flex items-center py-2 px-3 rounded hover:bg-red-900/40 text-red-300 transition-colors text-xs font-semibold ${
            isCollapsed ? "justify-center" : "space-x-3"
          }`}
          title="Logout Session"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
