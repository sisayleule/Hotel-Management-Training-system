import { useHotelStore } from "../store/useHotelStore.js";

export const useReservations = () => {
  const reservations = useHotelStore((state) => state.reservations);
  const createReservation = useHotelStore((state) => state.createReservation);
  const updateReservation = useHotelStore((state) => state.updateReservation);
  const cancelReservation = useHotelStore((state) => state.cancelReservation);
  const checkInGuest = useHotelStore((state) => state.checkInGuest);
  const checkOutGuest = useHotelStore((state) => state.checkOutGuest);
  const assignRoom = useHotelStore((state) => state.assignRoom);
  const postPayment = useHotelStore((state) => state.postPayment);

  const getReservationByNo = (resNo) => {
    return reservations.find((r) => r.reservation_no === resNo);
  };

  const getTodayArrivals = () => {
    const today = useHotelStore.getState().selectedDate;
    return reservations.filter((r) => r.arrival === today && r.status === "confirmed");
  };

  const getTodayDepartures = () => {
    const today = useHotelStore.getState().selectedDate;
    return reservations.filter((r) => r.departure === today && r.status === "checked_in");
  };

  return {
    reservations,
    createReservation,
    updateReservation,
    cancelReservation,
    checkInGuest,
    checkOutGuest,
    assignRoom,
    postPayment,
    getReservationByNo,
    getTodayArrivals,
    getTodayDepartures
  };
};

export default useReservations;
