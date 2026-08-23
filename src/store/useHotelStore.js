import { create } from "zustand";
import { persist } from "zustand/middleware";
import roomsData from "../data/rooms.js";
import roomTypesData from "../data/roomTypes.js";
import companiesData from "../data/companies.js";
import guestsData from "../data/guests.js";
import reservationsData from "../data/reservations.js";
import { supabase } from "../lib/supabaseClient.js";

export const useHotelStore = create(
  persist(
    (set, get) => ({
  // State
  rooms: [...roomsData],
  roomTypes: [...roomTypesData],
  companies: [...companiesData],
  guests: [...guestsData],
  reservations: [...reservationsData],
  currentUser: null, // No default user - require authentication
  selectedDate: "2026-06-30", // AMOB specified local time is June 30, 2026
  tutorialMode: false,
  hotelProfile: {
    name: "InnSync Training Hotel",
    propertyCode: "INNSYNC",
    address: "Ambo University, Woliso Campus",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    phone: "+91 022-28849514",
    gstNumber: "27AABCD1234E1Z5",
    starRating: "⭐⭐⭐⭐ 4 Stars"
  },
  displaySettings: {
    language: "English",
    dateFormat: "DD-MMM-YYYY",
    currency: "INR",
    timeFormat: "24 Hour",
    roomsPerPage: 80,
    theme: "IDS Classic (Beige)"
  },
  housekeeperStaff: [
    { id: "s1", name: "Priya Sharma", shift: "Morning Shift", assignedRooms: ["201", "202", "203", "204", "205"], cleanedToday: 2 },
    { id: "s2", name: "Anita Das", shift: "Morning Shift", assignedRooms: ["206", "207", "208", "209", "210"], cleanedToday: 1 },
    { id: "s3", name: "Raju Nair", shift: "Evening Shift", assignedRooms: ["211", "212"], cleanedToday: 3 },
    { id: "s4", name: "Meena Kaur", shift: "Evening Shift", assignedRooms: [], cleanedToday: 0 }
  ],
  maintenanceRequests: [],
  orders: [], // F&B orders
  orderCounter: 0, // Auto-increment for order numbers
  tempOrder: { table: null, items: [] }, // Temporary order for multi-outlet ordering

  // Auth actions
  login: (username, role) => set({
    currentUser: { name: username.toUpperCase() || "DEMO USER", role: role || "manager", username: username || "admin" }
  }),
  logout: async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Always end the local session and return to sign-in, even if the
      // remote sign-out request cannot complete.
      set({ currentUser: null });
      window.location.assign('/login');
    }
  },
  setTutorialMode: (val) => set({ tutorialMode: val }),
  updateHotelProfile: (profile) => set((state) => ({ hotelProfile: { ...state.hotelProfile, ...profile } })),
  updateDisplaySettings: (settings) => set((state) => ({ displaySettings: { ...state.displaySettings, ...settings } })),
  addMaintenanceRequest: (req) => set((state) => ({ maintenanceRequests: [...state.maintenanceRequests, req] })),

  // Actions
  updateRoomStatus: (roomNo, newStatus, guestName = "", reservationNo = "") => set((state) => ({
    rooms: state.rooms.map((room) =>
      room.room_no === roomNo
        ? {
            ...room,
            status: newStatus,
            guest_name: (newStatus === "vacant_clean" || newStatus === "dirty" || newStatus === "out_of_order" || newStatus === "out_of_service") ? "" : guestName || room.guest_name,
            reservation_no: (newStatus === "vacant_clean" || newStatus === "dirty" || newStatus === "out_of_order" || newStatus === "out_of_service") ? "" : reservationNo || room.reservation_no
          }
        : room
    )
  })),

  createReservation: (data) => {
    const reservationNo = `RES${String(get().reservations.length + 1).padStart(3, "0")}`;
    const newRes = {
      reservation_no: reservationNo,
      guest_name: data.guest_name,
      company_code: data.company_code || "",
      room_type: data.room_type,
      arrival: data.arrival,
      departure: data.departure,
      nights: data.nights || 1,
      adults: Number(data.adults || 1),
      children: Number(data.children || 0),
      pay_mode: data.pay_mode || "Cash",
      status: data.status || "confirmed",
      rooms_assigned: data.rooms_assigned || [],
      rate: Number(data.rate || 3500),
      total_amount: Number(data.total_amount || 3500),
      special_notes: data.special_notes || "",
      // Rate Information fields
      rate_code: data.rate_code || "BAR",
      meal_plan: data.meal_plan || "RO",
      currency: data.currency || "ETB",
      discount_percent: Number(data.discount_percent || 0),
      tax_percent: Number(data.tax_percent || 0),
      service_charge_percent: Number(data.service_charge_percent || 0),
      payments: []
    };

    // Handle guest creation based on duplicate check
    if (data._reuseExistingGuest && data._existingGuestId) {
      // User chose to reuse existing guest - do NOT create a new guest record
      // Reservation is already linked via guest_name
      console.log('Reusing existing guest:', data._existingGuestId);
    } else if (data._forceCreateNewGuest) {
      // User explicitly chose to create a new guest despite duplicate name
      // Force create a new guest with the same name but different ID
      const newGuest = {
        guest_id: `G${String(get().guests.length + 1).padStart(3, "0")}`,
        guest_name: data.guest_name,
        email: data.email || `${data.guest_name.toLowerCase().replace(/\s+/g, "")}@example.com`,
        phone: data.phone || "+251 900 000000",
        city: data.city || "Addis Ababa",
        state: data.state || "Addis Ababa",
        country: data.country || "Ethiopia",
        identity_type: data.identity_type || "National ID",
        identity_no: data.identity_no || "ET-9999-9",
        rating: "Regular"
      };
      set((state) => ({ guests: [...state.guests, newGuest] }));
      console.log('Force created new guest with duplicate name:', newGuest.guest_id);
    } else {
      // No duplicate dialog was shown - check if guest exists
      const guestExists = get().guests.some((g) => g.guest_name.toLowerCase().trim() === data.guest_name.toLowerCase().trim());
      
      if (!guestExists) {
        // Create new guest record
        const newGuest = {
          guest_id: `G${String(get().guests.length + 1).padStart(3, "0")}`,
          guest_name: data.guest_name,
          email: data.email || `${data.guest_name.toLowerCase().replace(/\s+/g, "")}@example.com`,
          phone: data.phone || "+251 900 000000",
          city: data.city || "Addis Ababa",
          state: data.state || "Addis Ababa",
          country: data.country || "Ethiopia",
          identity_type: data.identity_type || "National ID",
          identity_no: data.identity_no || "ET-9999-9",
          rating: "Regular"
        };
        set((state) => ({ guests: [...state.guests, newGuest] }));
        console.log('Created new guest:', newGuest.guest_id);
      }
    }

    // Assign room in status if specified
    if (data.rooms_assigned && data.rooms_assigned.length > 0) {
      const roomNo = data.rooms_assigned[0];
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room.room_no === roomNo
            ? { ...room, status: "reservation", guest_name: data.guest_name, reservation_no: reservationNo }
            : room
        )
      }));
    }

    set((state) => ({ reservations: [...state.reservations, newRes] }));
    return reservationNo;
  },

  updateReservation: (reservationNo, data) => set((state) => ({
    reservations: state.reservations.map((res) =>
      res.reservation_no === reservationNo ? { ...res, ...data } : res
    )
  })),

  cancelReservation: (reservationNo, reason = "") => set((state) => {
    return {
      reservations: state.reservations.map((res) =>
        res.reservation_no === reservationNo ? { ...res, status: "cancelled", cancellation_reason: reason } : res
      ),
      // Release any room tied to this reservation regardless of its current status
      // (covers both "reservation" and "occupied" rooms — the reservation_no on the
      //  room object is the authoritative link, not rooms_assigned which is often empty
      //  in seed data and for rooms checked-in via the legacy direct-assign flow).
      rooms: state.rooms.map((room) =>
        room.reservation_no === reservationNo
          ? { ...room, status: "vacant_clean", guest_name: "", reservation_no: "" }
          : room
      )
    };
  }),

  cancelReservationWithReason: () => {}, 

  assignRoomToReservation: (reservationNo, roomNo, guestIndex = 0) => set((state) => {
    const res = state.reservations.find(r => r.reservation_no === reservationNo);
    const guestName = res ? res.guest_name : "";
    return {
      reservations: state.reservations.map((r) =>
        r.reservation_no === reservationNo
          ? { ...r, rooms_assigned: [...new Set([...(r.rooms_assigned || []), roomNo])] }
          : r
      ),
      rooms: state.rooms.map((room) => {
        if (room.room_no === roomNo) {
          return { ...room, status: "reservation", guest_name: guestName, reservation_no: reservationNo };
        }
        return room;
      })
    };
  }),

  releaseRoomFromReservation: (reservationNo, roomNo) => set((state) => {
    return {
      reservations: state.reservations.map((r) =>
        r.reservation_no === reservationNo
          ? { ...r, rooms_assigned: (r.rooms_assigned || []).filter((no) => no !== roomNo) }
          : r
      ),
      rooms: state.rooms.map((room) =>
        room.room_no === roomNo && room.reservation_no === reservationNo
          ? { ...room, status: "vacant_clean", guest_name: "", reservation_no: "" }
          : room
      )
    };
  }),

  getReservationById: (reservationNo) => {
    return get().reservations.find((r) => r.reservation_no === reservationNo);
  },

  searchReservations: (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return get().reservations;
    return get().reservations.filter(
      (r) =>
        r.reservation_no.toLowerCase().includes(q) ||
        r.guest_name.toLowerCase().includes(q) ||
        (r.company_code && r.company_code.toLowerCase().includes(q)) ||
        r.room_type.toLowerCase().includes(q)
    );
  },

  filterReservations: (filters) => {
    return get().reservations.filter((r) => {
      if (filters.status && filters.status !== "All" && r.status !== filters.status.toLowerCase().replace(" ", "_")) {
        return false;
      }
      if (filters.room_type && filters.room_type !== "All" && r.room_type !== filters.room_type) {
        return false;
      }
      if (filters.pay_mode && filters.pay_mode !== "All" && r.pay_mode !== filters.pay_mode) {
        return false;
      }
      return true;
    });
  },

  checkInGuest: (reservationNo, roomNo) => set((state) => {
    const resObj = state.reservations.find(r => r.reservation_no === reservationNo);
    const guestName = resObj ? resObj.guest_name : "Occupant";

    return {
      reservations: state.reservations.map((res) =>
        res.reservation_no === reservationNo
          ? { ...res, status: "checked_in", rooms_assigned: [roomNo] }
          : res
      ),
      rooms: state.rooms.map((room) => {
        // The room already linked to this reservation via reservation_no is the
        // authoritative target. Flip it straight to occupied — do NOT clear it
        // back to vacant first (that was the bug: it undid the Assign Room step).
        if (room.room_no === roomNo) {
          return { ...room, status: "occupied", guest_name: guestName, reservation_no: reservationNo };
        }
        return room;
      })
    };
  }),

  checkOutGuest: (reservationNo) => set((state) => {
    return {
      reservations: state.reservations.map((resItem) =>
        resItem.reservation_no === reservationNo ? { ...resItem, status: "checked_out" } : resItem
      ),
      // Use room.reservation_no as the authoritative link — same pattern as
      // cancelReservation. The rooms_assigned array can be stale or empty,
      // but room.reservation_no is always set correctly by checkInGuest.
      rooms: state.rooms.map((room) =>
        room.reservation_no === reservationNo
          ? { ...room, status: "dirty", guest_name: "", reservation_no: "" }
          : room
      )
    };
  }),

  assignRoom: (reservationNo, roomNo) => set((state) => {
    const res = state.reservations.find(r => r.reservation_no === reservationNo);
    const guestName = res ? res.guest_name : "";
    return {
      reservations: state.reservations.map((r) =>
        r.reservation_no === reservationNo ? { ...r, rooms_assigned: [roomNo] } : r
      ),
      rooms: state.rooms.map((room) => {
        // Clear previous room assigned to this reservation
        if (room.reservation_no === reservationNo && room.status === "reservation") {
          return { ...room, status: "vacant_clean", guest_name: "", reservation_no: "" };
        }
        // Set room as reserved
        if (room.room_no === roomNo && room.status === "vacant_clean") {
          return { ...room, status: "reservation", guest_name: guestName, reservation_no: reservationNo };
        }
        return room;
      })
    };
  }),

  postPayment: (reservationNo, amount, payMode) => set((state) => ({
    reservations: state.reservations.map((res) =>
      res.reservation_no === reservationNo
        ? {
            ...res,
            payments: [
              ...(res.payments || []),
              { amount: Number(amount), method: payMode, date: state.selectedDate, remark: "Manual posting" }
            ]
          }
        : res
    )
  })),

  updateRoomHousekeeping: (roomNo, fields) => set((state) => ({
    rooms: state.rooms.map((room) =>
      room.room_no === roomNo
        ? { ...room, ...fields }
        : room
    )
  })),

  assignHousekeeperToRoom: (roomNo, housekeeperId) => set((state) => {
    return {
      rooms: state.rooms.map((room) =>
        room.room_no === roomNo
          ? { ...room, housekeeper_id: housekeeperId }
          : room
      ),
      housekeeperStaff: state.housekeeperStaff.map((staff) => {
        let assigned = staff.assignedRooms || [];
        if (staff.id === housekeeperId) {
          assigned = [...new Set([...assigned, roomNo])];
        } else {
          assigned = assigned.filter((no) => no !== roomNo);
        }
        return { ...staff, assignedRooms: assigned };
      })
    };
  }),

  resetToDemo: () => set({
    rooms: roomsData.map(r => ({ ...r, note: "", condition: "Normal", housekeeper_id: "" })),
    roomTypes: [...roomTypesData],
    companies: [...companiesData],
    guests: [...guestsData],
    reservations: reservationsData.map(res => ({ ...res, payments: [] })),
    selectedDate: "2026-06-30",
    orders: [],
    orderCounter: 0,
    housekeeperStaff: [
      { id: "s1", name: "Priya Sharma", shift: "Morning Shift", assignedRooms: ["201", "202", "203", "204", "205"], cleanedToday: 2 },
      { id: "s2", name: "Anita Das", shift: "Morning Shift", assignedRooms: ["206", "207", "208", "209", "210"], cleanedToday: 1 },
      { id: "s3", name: "Raju Nair", shift: "Evening Shift", assignedRooms: ["211", "212"], cleanedToday: 3 },
      { id: "s4", name: "Meena Kaur", shift: "Evening Shift", assignedRooms: [], cleanedToday: 0 }
    ],
    tutorialMode: false
  }),

  // F&B Order actions
  setTempOrder: (table, items) => set({ tempOrder: { table, items } }),
  
  clearTempOrder: () => set({ tempOrder: { table: null, items: [] } }),
  
  submitOrder: (orderData) => set((state) => {
    const newOrderCounter = state.orderCounter + 1;
    const orderNo = `ORD${String(newOrderCounter).padStart(3, "0")}`;
    
    const newOrder = {
      orderNo,
      outlet: orderData.outlet,
      restaurant: orderData.restaurant, // null for bar/room_service
      table: orderData.table,
      waiterName: state.currentUser.name,
      timestamp: new Date().toISOString(),
      items: orderData.items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        outlet: item.outlet || orderData.outlet, // Item-level outlet
        restaurant: item.restaurant || orderData.restaurant, // Item-level restaurant
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        isComplimentary: item.isComplimentary,
        lineTotal: item.lineTotal
      })),
      subtotal: orderData.subtotal,
      serviceCharge: orderData.serviceCharge || 0,
      tax: orderData.tax || 0,
      grandTotal: orderData.grandTotal,
      status: "submitted"
    };
    
    return {
      orders: [...state.orders, newOrder],
      orderCounter: newOrderCounter
    };
  }),

  // Room availability helper
  getAvailableRooms: (arrival, departure, roomTypeCode) => {
    const state = get();
    // Return vacant_clean rooms of specific room type
    return state.rooms.filter(
      (room) => room.status === "vacant_clean" && room.type_code === roomTypeCode
    );
  },

  // Dynamic statistics calculations
  getDashboardStats: () => {
    const state = get();
    const today = state.selectedDate;

    // Expected arrivals: 'confirmed' reservations on today's date
    const expectedArrivals = state.reservations.filter(
      (r) => r.arrival === today && r.status === "confirmed"
    ).length;

    // Expected departures: 'checked_in' reservations departing today
    const expectedDepartures = state.reservations.filter(
      (r) => r.departure === today && r.status === "checked_in"
    ).length;

    // Rooms to sell: vacant_clean rooms
    const roomsToSell = state.rooms.filter((r) => r.status === "vacant_clean").length;

    // Inhouse rooms & guests
    const inhouseRes = state.reservations.filter((r) => r.status === "checked_in");
    const inhouseRooms = state.rooms.filter((r) => r.status === "occupied").length;
    const inhouseGuests = inhouseRes.reduce((acc, curr) => acc + curr.adults + curr.children, 0);

    // Walk-ins (e.g. checked in today but no company)
    const walkInRooms = inhouseRes.filter((r) => r.arrival === today && !r.company_code).length;

    // Complaints
    const registeredComplaints = 1;

    // Extra adult & child count inhouse
    const extraAdultChild = inhouseRes.reduce((acc, curr) => {
      const extraAdults = curr.adults > 2 ? curr.adults - 2 : 0;
      return acc + extraAdults + curr.children;
    }, 0);

    // Foreign guests in house (where guest country is not Ethiopia)
    const inhouseForeignGuests = inhouseRes.filter((res) => {
      const guestObj = state.guests.find((g) => g.guest_name.toLowerCase() === res.guest_name.toLowerCase());
      return guestObj && guestObj.country !== "Ethiopia";
    }).reduce((acc, curr) => acc + curr.adults + curr.children, 0);

    // Blocked/OOD/OOS
    const guestBlock = state.rooms.filter((r) => r.status === "not_available").length;

    return {
      expectedArrivals,
      expectedDepartures,
      roomsToSell,
      inhouseGuests,
      walkInRooms,
      registeredComplaints,
      inhouseRooms,
      extraAdultChild,
      inhouseForeignGuests,
      guestBlock
    };
  }
}),
    {
      name: "hotel-storage", // localStorage key
      // Persist all data except currentUser (keep user session separate)
      partialize: (state) => ({
        rooms: state.rooms,
        roomTypes: state.roomTypes,
        companies: state.companies,
        guests: state.guests,
        reservations: state.reservations,
        selectedDate: state.selectedDate,
        housekeeperStaff: state.housekeeperStaff,
        maintenanceRequests: state.maintenanceRequests,
        orders: state.orders,
        orderCounter: state.orderCounter,
        tempOrder: state.tempOrder,
        hotelProfile: state.hotelProfile,
        displaySettings: state.displaySettings
      })
    }
  )
);

// Selectors
export const selectRoomsByFloor = (state, floor) => state.rooms.filter((r) => r.floor === Number(floor));
export const selectRoomsByStatus = (state, status) => state.rooms.filter((r) => r.status === status);
export const selectReservationsByStatus = (state, status) => state.reservations.filter((r) => r.status === status);
export const selectTodayArrivals = (state) => state.reservations.filter((r) => r.arrival === state.selectedDate && r.status === "confirmed");
export const selectTodayDepartures = (state) => state.reservations.filter((r) => r.departure === state.selectedDate && r.status === "checked_in");

// Computed Selectors for Phase 2
export const confirmedReservations = (state) => state.reservations.filter((r) => r.status === "confirmed");
export const checkedInReservations = (state) => state.reservations.filter((r) => r.status === "checked_in");
export const reservationsByDate = (state, date) => state.reservations.filter((r) => r.arrival === date);
