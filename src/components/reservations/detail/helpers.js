import { format, parseISO, isValid } from "date-fns";

// ── Date / money formatters ───────────────────────────────────────────────────

export function fmtDate(iso) {
  if (!iso) return "Not provided";
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, "d MMM yyyy") : iso;
  } catch {
    return iso;
  }
}

export function fmtMoney(amount, currency = "ETB") {
  const n = Number(amount);
  if (isNaN(n)) return "—";
  return `${currency} ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Label maps ────────────────────────────────────────────────────────────────

export const STATUS_LABEL = {
  confirmed:   "Confirmed — guest has not arrived",
  checked_in:  "In-house — guest is staying",
  checked_out: "Checked out",
  cancelled:   "Cancelled",
};

export const STATUS_CHIP = {
  confirmed:   "bg-blue-50 text-blue-800 border-blue-200",
  checked_in:  "bg-green-50 text-green-800 border-green-200",
  checked_out: "bg-gray-100 text-gray-700 border-gray-300",
  cancelled:   "bg-red-50 text-red-700 border-red-200",
};

export const RATE_CODE_LABEL = {
  BAR:  "BAR — Best Available Rate",
  CORP: "CORP — Corporate Rate",
};
export function rateCodeLabel(code) {
  return RATE_CODE_LABEL[code] || code || "Not provided";
}

export const MEAL_PLAN_LABEL = {
  RO: "RO — Room Only",
  BB: "BB — Bed & Breakfast",
  HB: "HB — Half Board",
  FB: "FB — Full Board",
};
export function mealPlanLabel(code) {
  return MEAL_PLAN_LABEL[code] || code || "Not provided";
}

// ── Charge calculation (same formula as RateInformationAccordion) ─────────────
// roomCharge      = rate × nights
// discountAmount  = roomCharge × (discountPercent / 100)
// afterDiscount   = roomCharge − discountAmount
// taxAmount       = afterDiscount × (taxPercent / 100)
// serviceCharge   = afterDiscount × (serviceChargePercent / 100)
// computed        = afterDiscount + taxAmount + serviceCharge

export function calculateCharges(reservation) {
  const rate     = Number(reservation.rate)                    || 0;
  const nights   = Number(reservation.nights)                  || 1;
  const disc     = Number(reservation.discount_percent)        || 0;
  const tax      = Number(reservation.tax_percent)             || 0;
  const svc      = Number(reservation.service_charge_percent)  || 0;

  const roomCharge         = rate * nights;
  const discountAmount     = roomCharge * (disc / 100);
  const afterDiscount      = roomCharge - discountAmount;
  const taxAmount          = afterDiscount * (tax / 100);
  const serviceChargeAmt   = afterDiscount * (svc / 100);
  const computed           = afterDiscount + taxAmount + serviceChargeAmt;

  const stored     = reservation.total_amount != null ? Number(reservation.total_amount) : computed;
  const adjustment = Math.abs(stored - computed) > 0.01 ? stored - computed : 0;

  return {
    rate, nights, disc, tax, svc,
    roomCharge, discountAmount, afterDiscount,
    taxAmount, serviceChargeAmt, computed,
    stored, adjustment,
  };
}

// ── Payment summary ───────────────────────────────────────────────────────────

export function paymentSummary(reservation) {
  const payments  = reservation.payments || [];
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const total     = reservation.total_amount != null
    ? Number(reservation.total_amount)
    : calculateCharges(reservation).computed;
  const balance   = total - totalPaid;
  return { payments, totalPaid, total, balance };
}

// ── Payment chip label ────────────────────────────────────────────────────────

export function paymentChip(reservation) {
  const { payments, totalPaid, total } = paymentSummary(reservation);
  if (reservation.company_code) return { label: "Billed to company", cls: "bg-purple-50 text-purple-800 border-purple-200" };
  if (payments.length === 0)     return { label: "Unpaid",            cls: "bg-red-50 text-red-700 border-red-200"          };
  if (totalPaid >= total - 0.01) return { label: "Paid",              cls: "bg-green-50 text-green-800 border-green-200"    };
  return                                { label: "Partially paid",    cls: "bg-amber-50 text-amber-800 border-amber-200"    };
}
