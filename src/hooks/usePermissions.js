/**
 * Permission Helper Hook
 * 
 * Provides a convenient interface to access role state and permission
 * checking functions from the useRoleStore.
 */

import { useRoleStore } from "../store/useRoleStore.js";

export const usePermissions = () => {
  const currentRole = useRoleStore((state) => state.currentRole);
  const permissions = useRoleStore((state) => state.permissions);
  const can = useRoleStore((state) => state.can);
  const canAny = useRoleStore((state) => state.canAny);
  const canAll = useRoleStore((state) => state.canAll);
  const getRoleMetadata = useRoleStore((state) => state.getRoleMetadata);
  
  const roleMetadata = getRoleMetadata();
  
  return {
    currentRole,
    permissions,
    can,
    canAny,
    canAll,
    roleName: roleMetadata?.name || "Unknown",
    roleDescription: roleMetadata?.description || "",
    isManager: currentRole === "hotel_manager"
  };
};

export default usePermissions;
