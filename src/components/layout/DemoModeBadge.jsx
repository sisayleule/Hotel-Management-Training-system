/**
 * DemoModeBadge Component
 *
 * Shows an inline banner (not a floating overlay) below the TopHeader when
 * demo/role-switcher mode is active. Sits in the normal document flow so it
 * never overlaps other content.
 */

import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions.js";
import { useRoleStore } from "../../store/useRoleStore.js";

export const DemoModeBadge = () => {
  const { roleName } = usePermissions();
  const demoMode = useRoleStore((state) => state.demoMode);

  if (!demoMode) return null;

  return (
    <Link
      to="/app/settings?tab=roles"
      className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold py-1 px-4 transition-colors shrink-0 select-none"
    >
      <Shield className="w-3.5 h-3.5 shrink-0" />
      <span>Demo Mode — Viewing as: {roleName} — Click to switch role</span>
    </Link>
  );
};

export default DemoModeBadge;
