/**
 * ProtectedRoute Component
 * 
 * Route-level authentication and permission enforcement.
 * Requires Supabase authentication and approved account status.
 * Optionally enforces role-based access control via requireRole prop.
 * 
 * @example
 * // Require authentication only (any approved user)
 * <Route path="dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 * 
 * @example
 * // Require specific auth role
 * <Route path="admin" element={
 *   <ProtectedRoute requireRole="admin">
 *     <AdminDashboard />
 *   </ProtectedRoute>
 * } />
 * 
 * @example
 * // Training RBAC permissions (existing functionality preserved)
 * <Route path="reservations" element={
 *   <ProtectedRoute requiredPermissions={[PERMISSIONS.RESERVATIONS_VIEW]}>
 *     <Reservations />
 *   </ProtectedRoute>
 * } />
 */

import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../hooks/usePermissions.js";
import { useRoleStore } from "../../store/useRoleStore.js";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export const ProtectedRoute = ({ children, requiredPermissions = [], requireRole = null }) => {
  const { user, profile, loading } = useSupabaseAuth();
  const { canAll } = usePermissions();
  const location = useLocation();
  const getNavConfig = useRoleStore((state) => state.getNavConfig);
  const [signingOut, setSigningOut] = useState(false);
  
  // Handle mid-session status changes (approved → banned/disabled/deleted)
  useEffect(() => {
    if (profile?.status !== 'approved' && !signingOut && !loading) {
      setSigningOut(true);
      supabase.auth.signOut();
    }
  }, [profile?.status, signingOut, loading]);
  
  // Show loading spinner while AuthContext checks auth AND status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ids-header mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Check if SupabaseLogin.jsx is currently handling a rejection (prevent race condition)
  // Security: Check staleness to prevent stuck flags from bypassing status checks
  const rejectingData = sessionStorage.getItem('auth_rejecting');
  let isLoginRejecting = false;
  
  if (rejectingData) {
    try {
      const { timestamp } = JSON.parse(rejectingData);
      const age = Date.now() - timestamp;
      
      // Flag is only valid for 5 seconds - after that, assume stale and clear it
      if (age < 5000) {
        isLoginRejecting = true;
      } else {
        sessionStorage.removeItem('auth_rejecting'); // Clear stale flag
      }
    } catch (e) {
      // Invalid JSON, clear it
      sessionStorage.removeItem('auth_rejecting');
    }
  }
  
  // If signing out due to mid-session status change, navigate to login with status info
  if (signingOut) {
    return <Navigate 
      to="/login" 
      state={{ 
        statusReason: profile?.status,
        bannedReason: profile?.banned_reason,
        rejectedReason: profile?.rejected_reason
      }} 
      replace 
    />;
  }
  
  // Enforce account status check on EVERY protected route (Req 7.15: mid-session disable must take effect immediately)
  // Skip this check ONLY if login page is actively rejecting to prevent redirect loops
  if (!isLoginRejecting && profile?.status !== 'approved') {
    // This should be caught by the useEffect above, but keep as safety net
    return <Navigate 
      to="/login" 
      state={{ 
        statusReason: profile.status,
        bannedReason: profile.banned_reason,
        rejectedReason: profile.rejected_reason
      }} 
      replace 
    />;
  }
  
  // Check auth role if required (admin/dept_head/student)
  if (requireRole && profile?.role !== requireRole) {
    toast.error('Access Denied: Insufficient privileges');
    return <Navigate to="/login" replace />;
  }
  
  // Check training permissions if required (existing RBAC)
  const hasPermission = requiredPermissions.length === 0 || canAll(requiredPermissions);
  
  useEffect(() => {
    if (!hasPermission) {
      console.warn(
        `[RBAC] Access denied to ${location.pathname}. Required permissions:`,
        requiredPermissions
      );
      toast.error("Access Denied: You do not have permission to view this page");
    }
  }, [hasPermission, location.pathname, requiredPermissions]);
  
  if (!hasPermission) {
    const navConfig = getNavConfig();
    return <Navigate to={navConfig.defaultDashboard} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
