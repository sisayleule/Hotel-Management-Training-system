import { useHotelStore } from "../store/useHotelStore.js";
import { useRoleStore } from "../store/useRoleStore.js";

export const useAuth = () => {
  const currentUser = useHotelStore((state) => state.currentUser);
  const login = useHotelStore((state) => state.login);
  const logout = useHotelStore((state) => state.logout);
  const currentRole = useRoleStore((state) => state.currentRole);

  const isAuthenticated = !!currentUser;
  const isManager = currentRole === "hotel_manager";
  const isHousekeeping = currentRole === "housekeeping";
  const isFrontDesk = currentRole === "front_office";
  const isWaiterFnb = currentRole === "waiter_fnb";

  return {
    currentUser,
    login,
    logout,
    isAuthenticated,
    isManager,
    isHousekeeping,
    isFrontDesk,
    currentRole,
    isWaiterFnb
  };
};

export default useAuth;
