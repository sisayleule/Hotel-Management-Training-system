import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHotelStore } from "../store/useHotelStore.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { ReservationDetailView } from "../components/reservations/detail/ReservationDetailView.jsx";
import { ArrowLeft } from "lucide-react";

export const DetailedReservation = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const reservations   = useHotelStore((s) => s.reservations);
  const reservation    = reservations.find((r) => r.reservation_no === id);

  if (!reservation) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto mt-16 bg-white border border-ids-border rounded-xl shadow-sm p-8 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-lg font-semibold text-ids-sidebar mb-2">Reservation not found</h2>
          <p className="text-sm text-gray-500 mb-6">
            No reservation with ID <span className="font-mono font-semibold">{id}</span> exists.
          </p>
          <button
            onClick={() => navigate("/app/reservations")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ids-header hover:bg-ids-sidebar text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to reservations
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ReservationDetailView reservation={reservation} />
    </PageWrapper>
  );
};

export default DetailedReservation;
