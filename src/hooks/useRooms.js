import { useHotelStore } from "../store/useHotelStore.js";

export const useRooms = () => {
  const rooms = useHotelStore((state) => state.rooms);
  const updateRoomStatus = useHotelStore((state) => state.updateRoomStatus);
  const getAvailableRooms = useHotelStore((state) => state.getAvailableRooms);

  const getRoomsByFloor = (floor) => {
    return rooms.filter((r) => r.floor === Number(floor));
  };

  const getRoomsByStatus = (status) => {
    return rooms.filter((r) => r.status === status);
  };

  return {
    rooms,
    updateRoomStatus,
    getAvailableRooms,
    getRoomsByFloor,
    getRoomsByStatus
  };
};

export default useRooms;
