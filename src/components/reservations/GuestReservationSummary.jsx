import React from "react";
import { useNavigate } from "react-router-dom";
import { useHotelStore } from "../../store/useHotelStore.js";
import { ArrowLeft, User, Calendar, CreditCard, ChevronRight } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, "d MMM yyyy") : iso;
  } catch {
    return iso;
  }
};

const STATUS_LABEL = {
  confirmed:   "Booked — guest has not arrived yet",
  checked_in:  "Guest is staying in the hotel",
  checked_out: "Guest has left",
  cancelled:   "Cancelled",
};

const STATUS_COLOR = {
  confirmed:   "bg-blue-50  text-blue-800  border-blue-200",
  checked_in:  "bg-green-50 text-green-800 border-green-200",
  checked_out: "bg-gray-100 text-gray-700  border-gray-300",
  cancelled:   "bg-red-50   text-red-700   border-red-200",
};

// ── sub-components ────────────────────────────────────────────────────────────

const Card = ({ title, hint, children }) => (
  <div className="bg-white border border-ids-border rounded-xl shadow-sm p-5 space-y-4">
    <div>
      <h3 className="text-base font-bold text-ids-sidebar">{title}</h3>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-sm text-gray-500 shrink-0">{label}</span>
    <span className="text-sm font-semibold text-gray-900 text-right">{value || "—"}</span>
  </div>
);

const ActionBtn = ({ onClick, children, variant = "primary" }) => {
  const base = "w-full min-h-[48px] rounded-lg font-semibold text-sm flex items-center justify-between px-4 transition-colors cursor-pointer";
  const styles = {
    primary:   "bg-ids-header hover:bg-ids-sidebar text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200",
    danger:    "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick}>
      <span>{children}</span>
      <ChevronRight className="w-4 h-4 opacity-60" />
    </button>
  );
};

// ── main component ────────────────────────────────────────────────────────────

/**
 * GuestReservationSummary — plain-English simple view of a reservation.
 *
 * Props:
 *   reservation   – reservation object from the store
 *   onShowAdvanced – callback to switch to the full advanced view
 */
export const GuestReservationSummary = ({ reservation, onShowAdvanced }) => {
  const navigate   = useNavigate();
  const roomTypes  = useHotelStore((s) => s.roomTypes);
  const companies  = useHotelStore((s) => s.companies);

  if (!reservation) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Reservation not found.
      </div>
    );
  }

  const {
    reservation_no,
    guest_name,
    status,
    arrival,
    departure,
    nights,
    adults,
    children,
    room_type,
    rooms_assigned,
    rate,
    total_amount,
    pay_mode,
    company_code,
  } = reservation;

  // Room type full name from store
  const rtObj     = roomTypes?.find((rt) => rt.type_code === room_type);
  const rtName    = rtObj ? rtObj.type_name : room_type || "—";

  // Room number
  const roomNo    = rooms_assigned?.length > 0 ? rooms_assigned[0] : "Not assigned yet";

  // Company name (only shown when company_code is set)
  const compObj   = companies?.find((c) => c.code === company_code);
  const compName  = compObj ? compObj.name : company_code || null;

  // Payment total
  const total     = total_amount ?? ((rate ?? 0) * (nights ?? 1));

  // Status display
  const statusLabel = STATUS_LABEL[status] ?? status ?? "Unknown";
  const statusColor = STATUS_COLOR[status] ?? "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate("/app/reservations")}
          className="mt-1 p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 shrink-0"
          aria-label="Back to reservations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium mb-0.5">Reservation {reservation_no}</p>
          <h1 className="text-xl font-bold text-ids-sidebar leading-tight break-words">{guest_name}</h1>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* ── 2-col grid on desktop ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Guest card */}
        <Card title="Guest" hint="Who is staying">
          <Row label="Name"     value={guest_name} />
          <Row label="Adults"   value={adults} />
          <Row label="Children" value={children} />
        </Card>

        {/* Stay card */}
        <Card title="Stay" hint="When and where">
          <Row label="Arrival"     value={fmtDate(arrival)} />
          <Row label="Departure"   value={fmtDate(departure)} />
          <Row label="Nights"      value={nights} />
          <Row label="Room type"   value={rtName} />
          <Row label="Room number" value={roomNo} />
        </Card>

        {/* Payment card */}
        <Card title="Payment" hint="What it costs">
          <Row label="Rate per night"   value={rate != null ? `ETB ${Number(rate).toLocaleString()}` : "—"} />
          <Row label="Nights"           value={nights} />
          <Row label="Total"            value={`ETB ${Number(total).toLocaleString()}`} />
          <Row label="Payment method"   value={pay_mode} />
          {compName && (
            <Row label="Billed to company" value={compName} />
          )}
        </Card>

        {/* Actions card */}
        <Card title="What would you like to do?">
          {status === "confirmed" && (
            <div className="space-y-2">
              <ActionBtn onClick={() => navigate(`/app/reservations/assign?id=${reservation_no}`)}>
                Assign Room
              </ActionBtn>
              <ActionBtn onClick={() => navigate(`/app/checkin?id=${reservation_no}`)}>
                Check In Guest
              </ActionBtn>
              <ActionBtn variant="secondary" onClick={() => navigate(`/app/reservations/amend?id=${reservation_no}`)}>
                Amend Booking
              </ActionBtn>
              <ActionBtn variant="danger" onClick={() => navigate(`/app/reservations/cancel?id=${reservation_no}`)}>
                Cancel Booking
              </ActionBtn>
            </div>
          )}

          {status === "checked_in" && (
            <div className="space-y-2">
              <ActionBtn onClick={() => navigate(`/app/checkout?id=${reservation_no}`)}>
                Check Out Guest
              </ActionBtn>
              <ActionBtn variant="secondary" onClick={() => navigate(`/app/cashiering?roomNo=${rooms_assigned?.[0] ?? ""}`)}>
                Post Charge
              </ActionBtn>
              <ActionBtn variant="secondary" onClick={() => navigate(`/app/cashiering?roomNo=${rooms_assigned?.[0] ?? ""}`)}>
                View Bill
              </ActionBtn>
            </div>
          )}

          {status === "checked_out" && (
            <div className="space-y-2">
              <ActionBtn variant="secondary" onClick={() => navigate(`/app/cashiering?roomNo=${rooms_assigned?.[0] ?? ""}`)}>
                View Bill
              </ActionBtn>
            </div>
          )}

          {status === "cancelled" && (
            <p className="text-sm text-gray-500">
              This reservation has been cancelled. No further actions are available.
            </p>
          )}
        </Card>

      </div>

      {/* ── Toggle to advanced ───────────────────────────────────────────── */}
      <div className="text-center pt-2">
        <button
          onClick={onShowAdvanced}
          className="text-sm text-ids-header hover:underline font-medium"
        >
          Show full details (advanced) →
        </button>
      </div>

    </div>
  );
};

export default GuestReservationSummary;
