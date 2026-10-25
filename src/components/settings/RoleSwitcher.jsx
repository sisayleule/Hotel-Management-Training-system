/**
 * Role Switcher Component
 * 
 * Displays all available roles as interactive cards.
 * Allows users to switch between roles for demo/training purposes.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../../config/rbac.js";
import { useRoleStore } from "../../store/useRoleStore.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import * as LucideIcons from "lucide-react";
import toast from "react-hot-toast";

export const RoleSwitcher = () => {
  const navigate = useNavigate();
  const { currentRole } = usePermissions();
  const setRole = useRoleStore((state) => state.setRole);
  const getNavConfig = useRoleStore((state) => state.getNavConfig);
  
  const handleSwitchRole = (roleId) => {
    setRole(roleId);
    const navConfig = getNavConfig();
    navigate(navConfig.defaultDashboard);
    
    const role = ROLES.find(r => r.id === roleId);
    toast.success(`Switched to: ${role.name}`);
  };
  
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-100 pb-3">
        <h3 className="font-black text-slate-800 uppercase text-[10px]">
          Role Switcher (Demo Mode)
        </h3>
        <p className="text-[10px] text-gray-400 mt-1">
          Preview how the system looks and behaves for each staff role. 
          This is for demonstration only — no real user accounts are affected.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROLES.map((role) => {
          const Icon = LucideIcons[role.icon] || LucideIcons.User;
          const isActive = currentRole === role.id;
          
          // Construct border color class based on role.color
          const borderColorClass = `border-${role.color}-500`;
          
          return (
            <div
              key={role.id}
              className={`border border-l-4 ${borderColorClass} rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                isActive ? "ring-2 ring-slate-800 shadow-lg" : ""
              }`}
              onClick={() => handleSwitchRole(role.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5" />
                  <span className="font-bold text-sm">{role.name}</span>
                </div>
                {isActive && (
                  <span className="text-[9px] bg-slate-800 text-white font-bold px-2 py-1 rounded uppercase">
                    Currently Active
                  </span>
                )}
              </div>
              
              <p className="text-xs text-gray-600 mb-3">{role.description}</p>
              
              <div className="text-[10px] text-gray-500">
                <span className="font-bold">You'll be able to:</span>
                <ul className="mt-1.5 space-y-1 list-disc list-inside">
                  {role.capabilities.map((cap, idx) => (
                    <li key={idx}>{cap}</li>
                  ))}
                </ul>
              </div>
              
              {!isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSwitchRole(role.id);
                  }}
                  className="mt-4 w-full py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs transition-all"
                >
                  Switch to this role
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSwitcher;
