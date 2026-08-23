import { format, parseISO, differenceInDays, addDays } from "date-fns";

export const getTodayString = () => {
  // Return ISO date string YYYY-MM-DD
  return "2026-06-30"; // Using the specified system local time date
};

export const formatDateDisplay = (dateString) => {
  if (!dateString) return "-";
  try {
    return format(parseISO(dateString), "dd-MMM-yyyy");
  } catch (e) {
    return dateString;
  }
};

export const formatDateFull = (dateString) => {
  if (!dateString) return "-";
  try {
    return format(parseISO(dateString), "eeee, dd MMMM yyyy");
  } catch (e) {
    return dateString;
  }
};

export const calculateNights = (arrival, departure) => {
  if (!arrival || !departure) return 1;
  try {
    const days = differenceInDays(parseISO(departure), parseISO(arrival));
    return days <= 0 ? 1 : days;
  } catch (e) {
    return 1;
  }
};

export const getFutureDate = (daysCount) => {
  const today = parseISO(getTodayString());
  return format(addDays(today, daysCount), "yyyy-MM-dd");
};
