/**
 * Demo Mode Badge Component
 * 
 * Displays a persistent badge showing the current demo role.
 * Appears when demo mode is active and provides a link to settings.
 */

import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions.js";
import { useRoleStore } from "../../store/useRoleStore.js";

export const DemoModeBadge = () => {
  const { roleName } = usePermissions();
  const demoMode = useRoleStore((state) => state.demoMode);
  
  if (!demoMode) {
    return null;
  }
  
  return (
    <Link 
      to="/settings?tab=roles" 
      className="fixed top-16 right-4 z-50 bg-amber-500 text-white px-3 py-1.5 rounded-full shadow-lg hover:bg-amber-600 transition-all flex items-center space-x-2 text-xs font-bold"
    >
      <Shield className="w-4 h-4" />
      <span>Demo Mode — Viewing as: {roleName}</span>
    </Link>
  );
};

export default DemoModeBadge;
