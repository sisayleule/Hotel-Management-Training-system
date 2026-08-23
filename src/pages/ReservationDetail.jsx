import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReservations } from "../hooks/useReservations.js";
import { useHotelStore } from "../store/useHotelStore.js";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Badge from "../components/ui/Badge.jsx";
import { formatDateDisplay } from "../utils/dateUtils.js";
import { formatCurrency } from "../utils/formatters.js";
import { ArrowLeft, User, CreditCard, LogIn, LogOut, Trash2, Plus, Receipt, Info, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export const ReservationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getReservationByNo, cancelReservation, checkInGuest, checkOutGuest, postPayment } = useReservations();
  const { rooms, getAvailableRooms, guests } = useHotelStore();

  const [selectedRoom, setSelectedRoom] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const paymentFormRef = useEnterAsTab({ onSubmit: (e) => handlePostPayment(e) });

  const res = getReservationByNo(id);

  if (!res) {
    return (
      <PageWrapper title="Folio Record Not Found">
        <div className="text-center py-12">
          <p className="text-sm text-gray-500 font-sans mb-4">No folio matches reservation number {id}.</p>
          <button
            id="btn-error-back"
            onClick={() => navigate("/app/reservations")}
            className="px-4 py-2 bg-ids-header text-white font-bold rounded text-xs"
          >
            Back to Directory
          </button>
        </div>
      </PageWrapper>
    );
  }

  // Look up guest profile
  const guestProfile = guests.find((g) => g.guest_name.toLowerCase() === res.guest_name.toLowerCase());

  // Get available rooms for checkin assignment
  const availableRooms = getAvailableRooms(res.arrival, res.departure, res.room_type);

  const handleCheckIn = () => {
    if (!selectedRoom) {
      toast.error("Please assign a room unit before check-in.");
      return;
    }
    checkInGuest(res.reservation_no, selectedRoom);
    toast.success(`Guest ${res.guest_name} successfully checked into Room ${selectedRoom}!`);
  };

  const handleCheckOut = () => {
    // Settle folio balance first
    const totalPayments = (res.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
    const balance = res.total_amount - totalPayments;

    if (balance > 0) {
      toast.error(`Folio balance is outstanding. Settle ${formatCurrency(balance)} first!`);
      return;
    }

    checkOutGuest(res.reservation_no);
    toast.success(`Guest ${res.guest_name} successfully checked out! Room is marked vacant dirty.`);
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      cancelReservation(res.reservation_no);
      toast.success("Reservation cancelled.");
    }
  };

  const handlePostPayment = (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    postPayment(res.reservation_no, paymentAmount, paymentMethod);
    toast.success(`Posted payment of ${formatCurrency(paymentAmount)} via ${paymentMethod}`);
    setPaymentAmount("");
  };

  const totalPayments = (res.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = res.total_amount - totalPayments;

  return (
    <PageWrapper
      title={`Guest Folio : ${res.reservation_no}`}
      subtitle="Examine guest stay details, audit billing charges, post payments, and handle check-in/out"
      action={
        <button
          id="btn-back-to-list"
          onClick={() => navigate("/app/reservations")}
          className="px-3 py-1.5 border border-ids-border hover:bg-gray-100 rounded text-xs font-bold font-sans text-gray-600 flex items-center space-x-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to List</span>
        </button>
      }
    >
      <div id="folio-details-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none font-sans text-xs">
        {/* Left Side: Folio Summary Card (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-ids-border rounded overflow-hidden shadow-xs">
            <div className="bg-ids-sidebar text-white px-4 py-2 text-xs font-bold uppercase tracking-wider border-b border-ids-border flex items-center justify-between">
              <span>Folio Particulars & Stay Details</span>
              <Badge status={res.status} />
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-ids-border/30 pb-3">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Guest Name</span>
                  <p className="text-sm font-bold text-gray-800 leading-tight flex items-center space-x-1.5 mt-0.5">
                    <User className="w-4 h-4 text-ids-header shrink-0" />
                    <span>{res.guest_name}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Corporate Account</span>
                  <p className="text-sm font-semibold text-gray-700 leading-tight mt-0.5">
                    {res.company_code || "Walk-In (Regular)"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-ids-border/30 pb-3">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Arrival Date</span>
                  <p className="font-bold text-gray-700 mt-0.5">{formatDateDisplay(res.arrival)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Departure Date</span>
                  <p className="font-bold text-gray-700 mt-0.5">{formatDateDisplay(res.departure)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Total Nights</span>
                  <p className="font-mono font-bold text-gray-700 mt-0.5">{res.nights}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Assigned Room</span>
                  <p className="font-mono font-bold text-orange-600 mt-0.5 text-sm">
                    {res.rooms_assigned.join(", ") || "None"}
                  </p>
                </div>
              </div>

              {/* Guest Profile Details */}
              {guestProfile && (
                <div className="bg-ids-bg/40 p-3 rounded border border-ids-border/40 space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Associated Guest File Card</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 font-medium">
                    <p>Phone: <span className="font-bold text-gray-800">{guestProfile.phone}</span></p>
                    <p>Email: <span className="font-bold text-gray-800">{guestProfile.email}</span></p>
                    <p>Origin: <span className="font-bold text-gray-800">{guestProfile.city}, {guestProfile.country}</span></p>
                    <p>ID Card: <span className="font-bold text-gray-800">{guestProfile.identity_type} ({guestProfile.identity_no || "-"})</span></p>
                  </div>
                </div>
              )}

              {/* Action Modules */}
              {res.status === "confirmed" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded space-y-3">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold text-yellow-800">
                      This reservation is CONFIRMED. Select an available room unit of type <span className="font-bold">{res.room_type}</span> to check them in.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      id="select-room-for-checkin"
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-ids-border bg-white rounded text-xs font-semibold focus:outline-none"
                    >
                      <option value="">-- Choose Vacant Room ({availableRooms.length} available) --</option>
                      {availableRooms.map((room) => (
                        <option key={room.room_no} value={room.room_no}>
                          Room {room.room_no} (Floor {room.floor} - {room.block})
                        </option>
                      ))}
                    </select>

                    <button
                      id="btn-perform-checkin"
                      onClick={handleCheckIn}
                      className="px-4 py-1.5 bg-room-vacant hover:bg-green-600 text-white font-bold rounded flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Execute Check-In</span>
                    </button>

                    <button
                      id="btn-perform-cancel"
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 font-bold rounded flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel Room</span>
                    </button>
                  </div>
                </div>
              )}

              {res.status === "checked_in" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded space-y-3">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold text-green-800">
                      The guest is checked in. Review the folio billing, and click below to process departure.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      id="btn-perform-checkout"
                      onClick={handleCheckOut}
                      className="px-4 py-1.5 bg-room-occupied hover:bg-red-600 text-white font-bold rounded flex items-center space-x-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Settle & Check-Out</span>
                    </button>
                  </div>
                </div>
              )}

              {res.status === "checked_out" && (
                <div className="p-3 bg-slate-100 border border-slate-300 rounded text-center text-slate-600 font-bold">
                  🏨 STAY COMPLETED & FOLIO FULLY SETTLED
                </div>
              )}

              {res.status === "cancelled" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-center text-red-600 font-bold">
                  ❌ RESERVATION HOLD CANCELLED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Ledger / Billing (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ledger Statement */}
          <div className="bg-white border border-ids-border rounded overflow-hidden shadow-xs">
            <div className="bg-ids-sidebar text-white px-4 py-2 text-xs font-bold uppercase tracking-wider border-b border-ids-border flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-white" />
              <span>Guest Ledger Statement</span>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1.5 border-b border-ids-border/30 pb-3 font-mono font-bold text-gray-700">
                <div className="flex justify-between">
                  <span>Room Charges Total:</span>
                  <span>{formatCurrency(res.total_amount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Payments Posted:</span>
                  <span>- {formatCurrency(totalPayments)}</span>
                </div>
                <div className="flex justify-between text-base text-orange-600 border-t border-ids-border/40 pt-1.5 mt-1.5">
                  <span>Folio Balance due:</span>
                  <span>{formatCurrency(balance)}</span>
                </div>
              </div>

              {/* Payments log */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Transaction Postings Log</span>
                <div className="border border-ids-border rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead className="bg-ids-bg border-b border-ids-border font-semibold text-gray-700">
                      <tr>
                        <th className="px-2.5 py-1.5">Date</th>
                        <th className="px-2.5 py-1.5">Method</th>
                        <th className="px-2.5 py-1.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ids-border">
                      <tr>
                        <td className="px-2.5 py-1.5 text-gray-500 font-mono">{formatDateDisplay(res.arrival)}</td>
                        <td className="px-2.5 py-1.5 text-gray-600">Night Audit Room Posting</td>
                        <td className="px-2.5 py-1.5 text-right font-mono font-bold text-gray-700">{formatCurrency(res.total_amount)}</td>
                      </tr>
                      {res.payments && res.payments.map((p, idx) => (
                        <tr key={idx} className="bg-green-50/20">
                          <td className="px-2.5 py-1.5 text-green-700 font-mono">{formatDateDisplay(p.date)}</td>
                          <td className="px-2.5 py-1.5 text-green-800">Payment Posted ({p.method})</td>
                          <td className="px-2.5 py-1.5 text-right font-mono font-bold text-green-600">- {formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                      {(!res.payments || res.payments.length === 0) && (
                        <tr>
                          <td colSpan={3} className="text-center py-3 text-gray-400 italic">No payments posted yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Post Payment Form */}
              {balance > 0 && (res.status === "checked_in" || res.status === "confirmed") && (
                <form ref={paymentFormRef} id="payment-post-form" onSubmit={handlePostPayment} className="p-3 border border-ids-border rounded bg-ids-bg/30 space-y-3">
                  <span className="text-[10px] font-bold text-ids-sidebar uppercase tracking-widest block">Post Transaction Settlement</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Post Amount</label>
                      <input
                        id="payment-amount"
                        type="number"
                        placeholder="ETB Amount"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-ids-border rounded focus:outline-none bg-white text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Receipt Plan</label>
                      <select
                        id="payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2 py-1.5 border border-ids-border bg-white rounded text-xs font-semibold focus:outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="UPI">UPI / Telebirr</option>
                      </select>
                    </div>
                  </div>
                  <button
                    id="btn-submit-payment"
                    type="submit"
                    className="w-full py-1.5 bg-ids-header hover:bg-ids-sidebar text-white font-bold text-xs rounded shadow-xs flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post Payment Settlement</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ReservationDetail;
