/**
 * Role Context Store - Global RBAC State Management
 * 
 * This Zustand store manages the current user role, permissions,
 * and provides permission checking functions for the application.
 */

import { create } from "zustand";
import { ROLES, ROLE_PERMISSIONS, NAV_CONFIG } from "../config/rbac.js";

const STORAGE_KEY = "pms_demo_role";

export const useRoleStore = create((set, get) => ({
  // ==================== STATE ====================
  
  currentRole: null,
  permissions: [],
  demoMode: true,
  
  // ==================== ACTIONS ====================
  
  /**
   * Initialize from localStorage or default to hotel_manager
   */
  initialize: () => {
    const storedRole = localStorage.getItem(STORAGE_KEY);
    const roleId = storedRole || "hotel_manager";
    get().setRole(roleId);
  },
  
  /**
   * Set active role and resolve permissions
   * @param {string} roleId - The role identifier (e.g., "front_office")
   */
  setRole: (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    if (!role) {
      console.error(`[RBAC] Invalid role: ${roleId}`);
      return;
    }
    
    const permissions = ROLE_PERMISSIONS[roleId] || [];
    localStorage.setItem(STORAGE_KEY, roleId);
    
    set({
      currentRole: roleId,
      permissions: permissions,
      demoMode: true
    });
    
    console.log(`[RBAC] Role switched to: ${role.name}`);
    console.log(`[RBAC] Permissions:`, permissions);
  },
  
  /**
   * Get role metadata for current role
   * @returns {Object|undefined} Role object with id, name, description, etc.
   */
  getRoleMetadata: () => {
    const roleId = get().currentRole;
    return ROLES.find(r => r.id === roleId);
  },
  
  /**
   * Get navigation config for current role
   * @returns {Object} Navigation config with navItems and defaultDashboard
   */
  getNavConfig: () => {
    const roleId = get().currentRole;
    return NAV_CONFIG[roleId] || NAV_CONFIG.hotel_manager;
  },
  
  // ==================== PERMISSION HELPERS ====================
  
  /**
   * Permission check: single permission
   * @param {string} permissionKey - The permission key (e.g., "reservations.view")
   * @returns {boolean} True if current role has the permission
   */
  can: (permissionKey) => {
    const { permissions } = get();
    
    // Wildcard grants all permissions
    if (permissions.includes("*")) {
      return true;
    }
    
    // Check exact match
    return permissions.includes(permissionKey);
  },
  
  /**
   * Permission check: at least one permission
   * @param {string[]} permissionKeys - Array of permission keys
   * @returns {boolean} True if current role has at least one permission
   */
  canAny: (permissionKeys) => {
    return permissionKeys.some(key => get().can(key));
  },
  
  /**
   * Permission check: all permissions required
   * @param {string[]} permissionKeys - Array of permission keys
   * @returns {boolean} True if current role has all permissions
   */
  canAll: (permissionKeys) => {
    return permissionKeys.every(key => get().can(key));
  }
}));

// ==================== INITIALIZATION ====================

// Initialize store on module load
if (typeof window !== "undefined") {
  useRoleStore.getState().initialize();
}
