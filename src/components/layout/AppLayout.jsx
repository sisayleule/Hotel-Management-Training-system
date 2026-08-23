import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import TopHeader from "./TopHeader.jsx";
import Sidebar from "./Sidebar.jsx";
import BottomNav from "./BottomNav.jsx";
import DemoModeBadge from "./DemoModeBadge.jsx";

export const AppLayout = () => {
  return (
    <div id="app-layout" className="flex flex-col h-screen overflow-hidden bg-ids-bg">
      {/* Notifications system */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "font-sans text-xs font-semibold bg-white border border-ids-border text-gray-800",
          duration: 3000,
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff"
            }
          }
        }}
      />

      {/* Top Header Bar */}
      <TopHeader />
      
      {/* Demo Mode Badge */}
      <DemoModeBadge />

      {/* Middle Core Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Desktop Bar */}
        <Sidebar />

        {/* Dynamic Center Main Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <Outlet />
        </main>
      </div>

      {/* Bottom Mobile Tab Bar */}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
