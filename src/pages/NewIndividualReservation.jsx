import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useReservations } from "../hooks/useReservations.js";
import { useHotelStore } from "../store/useHotelStore.js";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import RateInformationAccordion from "../components/reservations/RateInformationAccordion.jsx";
import DuplicateGuestDialog from "../components/reservations/DuplicateGuestDialog.jsx";
import { calculateNights, getTodayString, getFutureDate } from "../utils/dateUtils.js";
import { formatCurrency } from "../utils/formatters.js";
import { Save, X, User, Phone, Calendar, Users, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

export const NewIndividualReservation = () => {
  const navigate = useNavigate();
  const { createReservation } = useReservations();
  const { roomTypes, guests } = useHotelStore();

  // Duplicate guest dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingGuest, setExistingGuest] = useState(null);
  const [pendingReservationData, setPendingReservationData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = getTodayString();
  const tomorrowStr = getFutureDate(1);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      guest_name: "",
      room_type: "STD",
      arrival: todayStr,
      departure: tomorrowStr,
      nights: 1,
      adults: 1,
      children: 0,
      pay_mode: "Cash",
      rate: 2500,
      total_amount: 2500,
      email: "",
      phone: "",
      identity_type: "National ID",
      identity_no: "",
      special_notes: "",
      // Rate Information fields
      rateCode: "BAR",
      roomRate: 2500,
      mealPlan: "RO",
      currency: "ETB",
      discountPercent: 0,
      taxPercent: 0,
      serviceChargePercent: 0
    }
  });

  const watchArrival = watch("arrival");
  const watchDeparture = watch("departure");
  const watchNights = watch("nights");
  const watchRoomType = watch("room_type");
  const watchRate = watch("rate");
  const watchRoomRate = watch("roomRate");
  const watchDiscountPercent = watch("discountPercent");
  const watchTaxPercent = watch("taxPercent");
  const watchServiceChargePercent = watch("serviceChargePercent");

  // Auto-calculate nights
  useEffect(() => {
    const calculatedNts = calculateNights(watchArrival, watchDeparture);
    setValue("nights", calculatedNts);
  }, [watchArrival, watchDeparture, setValue]);

  // Auto-update rate when room type changes
  useEffect(() => {
    const typeObj = roomTypes.find((t) => t.type_code === watchRoomType);
    if (typeObj) {
      const baseRate = typeObj.rates.single;
      setValue("rate", baseRate);
      setValue("roomRate", baseRate);
    }
  }, [watchRoomType, roomTypes, setValue]);

  // Auto-calculate total amount using rate accordion formula
  useEffect(() => {
    const rate = Number(watchRoomRate) || 0;
    const nightsCount = Number(watchNights) || 1;
    const discount = Number(watchDiscountPercent) || 0;
    const tax = Number(watchTaxPercent) || 0;
    const serviceCharge = Number(watchServiceChargePercent) || 0;

    // Apply the exact formula from requirements
    const roomCharge = rate * nightsCount;
    const discountAmount = roomCharge * (discount / 100);
    const afterDiscount = roomCharge - discountAmount;
    const taxAmount = afterDiscount * (tax / 100);
    const serviceChargeAmount = afterDiscount * (serviceCharge / 100);
    const totalAmount = afterDiscount + taxAmount + serviceChargeAmount;

    setValue("total_amount", totalAmount);
  }, [watchRoomRate, watchNights, watchDiscountPercent, watchTaxPercent, watchServiceChargePercent, setValue]);

  const onFormSubmit = (data) => {
    // Check for duplicate guest name (case-insensitive, trimmed)
    const enteredName = data.guest_name.trim();
    const duplicateGuest = guests.find(
      (g) => g.guest_name.toLowerCase().trim() === enteredName.toLowerCase()
    );

    if (duplicateGuest) {
      // Duplicate found - show confirmation dialog
      setExistingGuest(duplicateGuest);
      setPendingReservationData(data);
      setShowDuplicateDialog(true);
    } else {
      // No duplicate - proceed directly
      createReservationWithData(data, false);
    }
  };

  const createReservationWithData = async (data, reuseExistingGuest) => {
    const resPayload = {
      ...data,
      company_code: "",
      status: "confirmed",
      rooms_assigned: [],
      // Map form fields to reservation fields
      rate: Number(data.roomRate),
      rate_code: data.rateCode,
      meal_plan: data.mealPlan,
      currency: data.currency,
      discount_percent: Number(data.discountPercent) || 0,
      tax_percent: Number(data.taxPercent) || 0,
      service_charge_percent: Number(data.serviceChargePercent) || 0,
      // Flag to indicate whether to reuse existing guest
      _reuseExistingGuest: reuseExistingGuest,
      _existingGuestId: reuseExistingGuest ? existingGuest?.guest_id : null
    };

    setSubmitting(true);
    try {
      const resNo = await createReservation(resPayload);
      toast.success(`✅ Individual Reservation ${resNo} created successfully!`);
      navigate("/app/reservations");
    } catch (err) {
      toast.error(`Failed to create reservation: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueWithExisting = () => {
    setShowDuplicateDialog(false);
    createReservationWithData(pendingReservationData, true);
  };

  const handleCreateNewGuest = () => {
    setShowDuplicateDialog(false);
    createReservationWithData(pendingReservationData, false);
  };

  const formRef = useEnterAsTab({ onSubmit: handleSubmit(onFormSubmit) });

  return (
    <PageWrapper
      title="Individual Guest Reservation"
      subtitle="Create walk-in reservation for individual guests"
    >
      <form ref={formRef} onSubmit={handleSubmit(onFormSubmit)} className="max-w-4xl mx-auto space-y-6">
        
        {/* Guest Information Card */}
        <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
            <h2 className="text-sm font-bold text-blue-900 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>GUEST INFORMATION</span>
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Guest Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Guest Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter guest name (e.g., John Smith)"
                {...register("guest_name", { required: "Guest name is required" })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base"
              />
              {errors.guest_name && (
                <p className="text-red-500 text-sm mt-1">{errors.guest_name.message}</p>
              )}
            </div>

            {/* Contact Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  {...register("phone")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="guest@email.com"
                  {...register("email")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* ID Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ID Type
                </label>
                <select
                  {...register("identity_type")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="National ID">National ID</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  placeholder="Enter ID number"
                  {...register("identity_no")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Special Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Special Notes / Guest Preferences
              </label>
              <textarea
                placeholder="Enter any special requests, preferences, or notes to remember about the guest (e.g., allergies, room preferences, VIP status, etc.)"
                {...register("special_notes")}
                rows={3}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-y"
              />
              <p className="text-xs text-gray-500 mt-1">
                This information will help staff provide better service to the guest
              </p>
            </div>
          </div>
        </div>

        {/* Stay Details Card */}
        <div className="bg-white border-2 border-green-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-green-50 px-4 py-3 border-b border-green-200">
            <h2 className="text-sm font-bold text-green-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>STAY DETAILS</span>
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Dates Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Check-In Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("arrival")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Check-Out Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("departure")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Total Nights
                </label>
                <input
                  type="number"
                  disabled
                  value={watchNights}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-100 font-bold text-lg text-center"
                />
              </div>
            </div>

            {/* Room Type and Guests Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Room Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("room_type")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 font-bold"
                >
                  {roomTypes.map((type) => (
                    <option key={type.type_code} value={type.type_code}>
                      {type.type_name} - {formatCurrency(type.rates.single)}/night
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Adults
                </label>
                <select
                  {...register("adults")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                >
                  <option value="1">1 Adult</option>
                  <option value="2">2 Adults</option>
                  <option value="3">3 Adults</option>
                  <option value="4">4 Adults</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Children
                </label>
                <select
                  {...register("children")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                >
                  <option value="0">0 Children</option>
                  <option value="1">1 Child</option>
                  <option value="2">2 Children</option>
                  <option value="3">3 Children</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Information Accordion - Replaces Payment Details */}
        <RateInformationAccordion
          roomType={watchRoomType}
          rateCode={watch("rateCode")}
          roomRate={watchRoomRate}
          nights={watchNights}
          adults={watch("adults")}
          children={watch("children")}
          mealPlan={watch("mealPlan")}
          currency={watch("currency")}
          discountPercent={watchDiscountPercent}
          taxPercent={watchTaxPercent}
          serviceChargePercent={watchServiceChargePercent}
          register={register}
          setValue={setValue}
          errors={errors}
        />

        {/* Payment Method Card */}
        <div className="bg-white border-2 border-purple-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
            <h2 className="text-sm font-bold text-purple-900 flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>PAYMENT METHOD</span>
            </h2>
          </div>
          
          <div className="p-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                {...register("pay_mode")}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI / Digital Wallet</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/app/reservations")}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "Saving…" : "Create Reservation"}</span>
          </button>
        </div>
      </form>

      {/* Duplicate Guest Confirmation Dialog */}
      <DuplicateGuestDialog
        isOpen={showDuplicateDialog}
        guestName={pendingReservationData?.guest_name}
        existingGuest={existingGuest}
        onContinue={handleContinueWithExisting}
        onCreateNew={handleCreateNewGuest}
      />
    </PageWrapper>
  );
};

export default NewIndividualReservation;
