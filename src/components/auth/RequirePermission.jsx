/**
 * RequirePermission Component
 * 
 * Conditional rendering wrapper that displays children only when
 * permission check passes, otherwise renders fallback (default: null).
 * 
 * @example
 * // Single permission check
 * <RequirePermission permission={PERMISSIONS.RESERVATIONS_EDIT}>
 *   <button>Edit Reservation</button>
 * </RequirePermission>
 * 
 * @example
 * // Multiple permissions check (at least one required)
 * <RequirePermission permissions={[PERMISSIONS.BILLING_POST_CHARGES, PERMISSIONS.BILLING_PROCESS_PAYMENTS]}>
 *   <button>Post Payment</button>
 * </RequirePermission>
 * 
 * @example
 * // With custom fallback
 * <RequirePermission permission={PERMISSIONS.REPORTS_VIEW} fallback={<div>Access Denied</div>}>
 *   <ReportViewer />
 * </RequirePermission>
 */

import React from "react";
import { usePermissions } from "../../hooks/usePermissions.js";

export const RequirePermission = ({ permission, permissions, children, fallback = null }) => {
  const { can, canAny } = usePermissions();
  
  // Check single permission
  if (permission && !can(permission)) {
    return fallback;
  }
  
  // Check multiple permissions (at least one required)
  if (permissions && !canAny(permissions)) {
    return fallback;
  }
  
  return <>{children}</>;
};

export default RequirePermission;
