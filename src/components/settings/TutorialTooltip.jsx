import React from "react";
import { useHotelStore } from "../../store/useHotelStore.js";

// Comprehensive dictionary of hotel PMS terms
export const TUTORIAL_TIPS = {
  'arrival_date': 'The date the guest will arrive and check in to the hotel.',
  'departure_date': 'The date the guest will leave. The room is due back on this date.',
  'nights': 'Total number of nights the guest will stay. Auto-calculated from arrival and departure.',
  'room_type': 'Category of room — Deluxe, Executive, Suite, or Penthouse. Each has different rates.',
  'booker_type': 'Who is making this reservation? Direct = guest, Corporate = company booking.',
  'market_segment': 'How the reservation was categorized. CV1 = Complimentary, FIT = Free Independent Traveler, GRP = Group booking, CORP = Corporate.',
  'pay_mode': 'How will the final bill be paid? Direct Billing = company pays later, Cash/Credit Card = guest pays.',
  'status_confirmed': 'Booking is confirmed but guest has not arrived yet.',
  'status_checked_in': 'Guest has arrived and is currently staying in the hotel.',
  'status_vacant_clean': 'Room is empty and cleaned — ready for the next guest to check in.',
  'status_vacant_dirty': 'Room is empty but needs cleaning after previous guest checked out.',
  'status_occupied': 'A guest is currently staying in this room.',
  'status_out_of_order': 'Room is broken or under maintenance — cannot be sold to guests.',
  'status_out_of_service': 'Room is temporarily out of service for light housekeeping.',
  'folio': 'The guest billing account/ledger. All room charges, restaurant bills, and payments are recorded here.',
  'advance_payment': 'Payment collected at time of booking. Reduces the balance due at checkout.',
  'occupancy_percent': 'Occupied Rooms ÷ Total Rooms × 100. A 70% occupancy is considered good performance.',
  'room_rate': 'The price charged per night for this room type.',
  'extra_adult': 'Additional charge when a third or fourth adult stays in a room.',
  'company_code': 'Unique ID for corporate companies that have pre-negotiated contracts or accounts with the hotel.',
  'booking_source': 'Where the reservation came from — direct, OTA (Booking.com), travel agent, etc.',
  'reservation_number': 'Unique ID for each booking. Use this to quickly find any reservation.',
  'housekeeping_status': 'Shows if room needs cleaning (dirty), is ready (clean), or has maintenance issues.',
  'guest_folio': 'Running bill for the guest — all charges and payments tracked here.',
  'check_in_time': 'Standard check-in time is 14:00 (2:00 PM). Early check-in may have charges.',
  'check_out_time': 'Standard check-out is 12:00 noon. Late checkout may have charges.',
};

export const TutorialTooltip = ({ fieldName, children }) => {
  const tutorialMode = useHotelStore((state) => state.tutorialMode);
  const tooltipText = TUTORIAL_TIPS[fieldName];

  if (!tutorialMode || !tooltipText) return <>{children}</>;

  return (
    <div className="relative group w-full">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 leading-relaxed text-center font-sans">
        <span className="font-bold text-amber-400">🎓 PMS TIP:</span> {tooltipText}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );
};

export default TutorialTooltip;
