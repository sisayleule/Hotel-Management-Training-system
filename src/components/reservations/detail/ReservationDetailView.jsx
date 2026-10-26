import React from "react";
import { useHotelStore } from "../../../store/useHotelStore.js";
import { ReservationHeader }  from "./ReservationHeader.jsx";
import { SummaryStrip }       from "./SummaryStrip.jsx";
import { GuestInfoCard }      from "./GuestInfoCard.jsx";
import { StayCard }           from "./StayCard.jsx";
import { ChargesCard }        from "./ChargesCard.jsx";
import { PaymentsCard }       from "./PaymentsCard.jsx";
import { NotesCard }          from "./NotesCard.jsx";
import { StatusTimeline }     from "./StatusTimeline.jsx";
import { ActionsPanel }       from "./ActionsPanel.jsx";

/**
 * ReservationDetailView — full professional single-page reservation record.
 * Layout: header + summary strip, then two-column on desktop (main | side).
 * Mobile: header, summary, actions, then cards stacked.
 */
export function ReservationDetailView({ reservation }) {
  const guests    = useHotelStore((s) => s.guests);
  const roomTypes = useHotelStore((s) => s.roomTypes);
  const companies = useHotelStore((s) => s.companies);

  // Match guest record by name (case-insensitive)
  const guest = guests?.find(
    (g) => g.guest_name.toLowerCase().trim() === reservation.guest_name.toLowerCase().trim()
  );

  // Room type full name
  const rtObj = roomTypes?.find((rt) => rt.type_code === reservation.room_type);
  const roomTypeName = rtObj?.type_name || reservation.room_type || "";

  // Company name
  const compObj   = companies?.find((c) => c.code === reservation.company_code);
  const companyName = compObj?.name || reservation.company_code || "";

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 space-y-0">

      {/* Header */}
      <ReservationHeader reservation={reservation} />

      {/* Summary strip */}
      <SummaryStrip reservation={reservation} />

      {/* Mobile: actions first, then cards */}
      <div className="block lg:hidden mb-6 space-y-4">
        <ActionsPanel  reservation={reservation} />
        <StatusTimeline reservation={reservation} />
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Main column (left, 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <GuestInfoCard  reservation={reservation} guest={guest} />
          <StayCard       reservation={reservation} roomTypeName={roomTypeName} companyName={companyName} />
          <ChargesCard    reservation={reservation} />
          <PaymentsCard   reservation={reservation} companyName={companyName} />
          <NotesCard      reservation={reservation} />
        </div>

        {/* Side column (right, 1/3) — sticky on desktop */}
        <div className="hidden lg:block lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <StatusTimeline reservation={reservation} />
          <ActionsPanel   reservation={reservation} />
        </div>

      </div>
    </div>
  );
}

export default ReservationDetailView;
