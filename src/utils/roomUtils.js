export const getRoomStatusColors = (status) => {
  switch (status) {
    case "vacant_clean":
      return {
        bg: "bg-room-vacant",
        border: "border-room-vacant",
        text: "text-white",
        lightBg: "bg-green-50",
        lightText: "text-room-vacant"
      };
    case "dirty":
      return {
        bg: "bg-room-dirty",
        border: "border-room-dirty",
        text: "text-white",
        lightBg: "bg-orange-50",
        lightText: "text-room-dirty"
      };
    case "occupied":
      return {
        bg: "bg-room-occupied",
        border: "border-room-occupied",
        text: "text-white",
        lightBg: "bg-red-50",
        lightText: "text-room-occupied"
      };
    case "reservation":
      return {
        bg: "bg-room-reservation",
        border: "border-room-reservation",
        text: "text-dark",
        lightBg: "bg-yellow-50",
        lightText: "text-room-reservation"
      };
    case "not_available":
    default:
      return {
        bg: "bg-slate-400",
        border: "border-slate-400",
        text: "text-white",
        lightBg: "bg-slate-50",
        lightText: "text-slate-500"
      };
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case "vacant_clean":
      return "Vacant Clean";
    case "dirty":
      return "Vacant Dirty";
    case "occupied":
      return "Occupied";
    case "reservation":
      return "Reserved";
    case "not_available":
      return "Out of Order";
    default:
      return status;
  }
};
