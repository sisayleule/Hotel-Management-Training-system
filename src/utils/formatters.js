export const formatCurrency = (value) => {
  if (value === undefined || value === null) return "ETB 0.00";
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const capitalizeWord = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatRoomStatus = (status) => {
  if (!status) return "";
  return status.split("_").map(capitalizeWord).join(" ");
};
