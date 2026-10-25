import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReservations } from "../hooks/useReservations.js";
import { useHotelStore } from "../store/useHotelStore.js";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { Save, X, User, Calendar, Users, CreditCard, Building2 } from "lucide-react";
import toast from "react-hot-toast";

export const NewReservationSimple = () => {
  const navigate = useNavigate();
  const { createReservation } = useReservations();
  const { roomTypes } = useHotelStore();

  // Tab selection: 'individual' or 'company'
  const [bookingType, setBookingType] = useState("individual");

  // Individual Form State
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idType, setIdType] = useState("Passport");
  const [idNumber, setIdNumber] = useState("");
  
  // Company Form State
  const [companyName, setCompanyName] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  // Common Booking Details
  const [roomType, setRoomType] = useState("DLX");
  const [arrivalDate, setArrivalDate] = useState(getTodayDate());
  const [departureDate, setDepartureDate] = useState(getTomorrowDate());
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [specialRequests, setSpecialRequests] = useState("");

  // Helper functions
  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  function calculateNights() {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    const diff = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }

  function calculateTotalAmount() {
    const selectedType = roomTypes.find(t => t.type_code === roomType);
    if (!selectedType) return 0;
    const rate = selectedType.rates.single;
    const nights = calculateNights();
    // Apply 15% corporate discount for company bookings
    const discount = bookingType === "company" ? 0.85 : 1.0;
    return Math.round(rate * nights * discount);
  }

  const formRef = useEnterAsTab({ onSubmit: (e) => handleSubmit(e) });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (bookingType === "individual" && !guestName.trim()) {
      toast.error("Please enter guest name");
      return;
    }

    if (bookingType === "company" && !companyName.trim()) {
      toast.error("Please enter company name");
      return;
    }

    // Create reservation object
    const reservationData = {
      guest_name: bookingType === "individual" ? guestName : `${companyName} (Corporate)`,
      company_code: bookingType === "company" ? companyName : "",
      room_type: roomType,
      arrival: arrivalDate,
      departure: departureDate,
      nights: calculateNights(),
      adults: adults,
      children: children,
      pay_mode: bookingType === "company" ? "Bill to Company" : paymentMode,
      rate: roomTypes.find(t => t.type_code === roomType)?.rates.single || 0,
      total_amount: calculateTotalAmount(),
      email: bookingType === "individual" ? email : companyEmail,
      phone: bookingType === "individual" ? phone : companyPhone,
      city: "",
      country: "",
      identity_type: bookingType === "individual" ? idType : "Company Registration",
      identity_no: bookingType === "individual" ? idNumber : gstNumber,
      status: "confirmed",
      rooms_assigned: []
    };

    const resNo = createReservation(reservationData);
    toast.success(`✅ Reservation ${resNo} created successfully!`);
    navigate("/app/reservations");
  };

  const nights = calculateNights();
  const totalAmount = calculateTotalAmount();

  return (
    <PageWrapper
      title="Create New Reservation"
      subtitle="Simple booking form for hotel guests - Individual or Company bookings"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 max-w-4xl mx-auto">
        
        {/* Booking Type Selector */}
        <div className="bg-white border border-ids-border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-bold text-ids-sidebar uppercase tracking-wider mb-3">
            Select Booking Type
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBookingType("individual")}
              className={`p-4 rounded-lg border-2 transition-all ${
                bookingType === "individual"
                  ? "border-ids-header bg-blue-50 text-ids-header"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <User className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold text-sm">Individual Guest</div>
              <div className="text-xs text-gray-500 mt-1">Walk-in or personal booking</div>
            </button>
            
            <button
              type="button"
              onClick={() => setBookingType("company")}
              className={`p-4 rounded-lg border-2 transition-all ${
                bookingType === "company"
                  ? "border-ids-header bg-blue-50 text-ids-header"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <Building2 className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold text-sm">Company Booking</div>
              <div className="text-xs text-gray-500 mt-1">Corporate or business booking</div>
            </button>
          </div>
        </div>

        {/* INDIVIDUAL GUEST FORM */}
        {bookingType === "individual" && (
          <div className="bg-white border border-ids-border rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-ids-sidebar uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Guest Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter guest full name"
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header focus:border-ids-header text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header focus:border-ids-header text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@email.com"
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header focus:border-ids-header text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  ID Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                >
                  <option value="Passport">Passport</option>
                  <option value="National ID">National ID</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter ID number"
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* COMPANY BOOKING FORM */}
        {bookingType === "company" && (
          <div className="bg-white border border-ids-border rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-ids-sidebar uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Information
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-xs text-yellow-800 font-semibold">
                💼 Corporate bookings receive 15% discount automatically
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  placeholder="Contact person name"
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Company Phone
                </label>
                <input
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="company@business.com"
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  GST / Tax Number
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="Enter GST/Tax number"
                  className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* BOOKING DETAILS (COMMON FOR BOTH) */}
        <div className="bg-white border border-ids-border rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-bold text-ids-sidebar uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Booking Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Room Type *
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm font-semibold"
              >
                {roomTypes.map((type) => (
                  <option key={type.type_code} value={type.type_code}>
                    {type.type_name} - ₹{type.rates.single}/night
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                disabled={bookingType === "company"}
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI/Digital Wallet</option>
                <option value="Bill to Company">Bill to Company</option>
              </select>
              {bookingType === "company" && (
                <p className="text-xs text-gray-500 mt-1">Auto-set to "Bill to Company"</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Check-In Date *
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Check-Out Date *
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={arrivalDate}
                className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Number of Adults *
              </label>
              <select
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} Adult{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Number of Children
              </label>
              <select
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm"
              >
                {[0, 1, 2, 3, 4].map(num => (
                  <option key={num} value={num}>{num} Child{num !== 1 ? 'ren' : ''}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special requirements or requests..."
                rows={3}
                className="w-full px-3 py-2 border border-ids-border rounded focus:ring-2 focus:ring-ids-header text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* BOOKING SUMMARY */}
        <div className="bg-gradient-to-r from-ids-sidebar to-ids-header text-white rounded-lg p-5 shadow-lg">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Booking Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-200 text-xs">Room Type:</span>
              <div className="font-bold">{roomTypes.find(t => t.type_code === roomType)?.type_name}</div>
            </div>
            <div>
              <span className="text-gray-200 text-xs">Total Nights:</span>
              <div className="font-bold">{nights} Night{nights > 1 ? 's' : ''}</div>
            </div>
            <div>
              <span className="text-gray-200 text-xs">Guests:</span>
              <div className="font-bold">{adults} Adult{adults > 1 ? 's' : ''}, {children} Child{children !== 1 ? 'ren' : ''}</div>
            </div>
            <div>
              <span className="text-gray-200 text-xs">Payment:</span>
              <div className="font-bold">{bookingType === "company" ? "Bill to Company" : paymentMode}</div>
            </div>
          </div>
          <div className="border-t border-white/30 mt-3 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold uppercase">Total Amount:</span>
              <span className="text-3xl font-black text-yellow-300">₹{totalAmount.toLocaleString()}</span>
            </div>
            {bookingType === "company" && (
              <p className="text-xs text-green-300 mt-1">✓ 15% corporate discount applied</p>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/app/reservations")}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition-colors flex items-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            Create Reservation
          </button>
        </div>

      </form>
    </PageWrapper>
  );
};

export default NewReservationSimple;
