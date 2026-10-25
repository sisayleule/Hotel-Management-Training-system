import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useReservations } from "../hooks/useReservations.js";
import { useHotelStore } from "../store/useHotelStore.js";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import SearchPopup from "../components/ui/SearchPopup.jsx";
import RateInformationAccordion from "../components/reservations/RateInformationAccordion.jsx";
import DuplicateGuestDialog from "../components/reservations/DuplicateGuestDialog.jsx";
import { calculateNights, getTodayString, getFutureDate } from "../utils/dateUtils.js";
import { formatCurrency } from "../utils/formatters.js";
import { Save, X, Building2, Search, User, Calendar, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

export const NewCompanyReservation = () => {
  const navigate = useNavigate();
  const { createReservation } = useReservations();
  const { roomTypes, companies } = useHotelStore();
  
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCompanyPopupOpen, setIsCompanyPopupOpen] = useState(false);

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
      pay_mode: "Bill to Company",
      rate: 2500,
      total_amount: 2500,
      email: "",
      phone: "",
      special_notes: "",
      // Rate Information fields
      rateCode: "CORP",
      roomRate: 2500,
      mealPlan: "BB",
      currency: "ETB",
      discountPercent: 15, // Default corporate discount
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

  // Auto-update rate (with 15% corporate discount)
  useEffect(() => {
    const typeObj = roomTypes.find((t) => t.type_code === watchRoomType);
    if (typeObj) {
      const baseRate = typeObj.rates.single;
      setValue("rate", baseRate);
      setValue("roomRate", baseRate);
      // Set default corporate discount when company is selected
      if (selectedCompany) {
        setValue("discountPercent", 15);
      }
    }
  }, [watchRoomType, selectedCompany, roomTypes, setValue]);

  // Auto-calculate total using rate accordion formula
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
    if (!selectedCompany) {
      toast.error("Please select a company!");
      return;
    }

    const resPayload = {
      ...data,
      company_code: selectedCompany.company_code,
      status: "confirmed",
      rooms_assigned: [],
      // Map form fields to reservation fields
      rate: Number(data.roomRate),
      rate_code: data.rateCode,
      meal_plan: data.mealPlan,
      currency: data.currency,
      discount_percent: Number(data.discountPercent) || 0,
      tax_percent: Number(data.taxPercent) || 0,
      service_charge_percent: Number(data.serviceChargePercent) || 0
    };

    const resNo = createReservation(resPayload);
    toast.success(`✅ Company Reservation ${resNo} created for ${selectedCompany.name}!`);
    navigate("/app/reservations");
  };

  const formRef = useEnterAsTab({ onSubmit: handleSubmit(onFormSubmit) });

  const companyColumns = [
    { header: "Code", accessor: "company_code" },
    { header: "Company Name", accessor: "name" },
    { header: "City", accessor: "city" }
  ];

  return (
    <PageWrapper
      title="Company / Corporate Reservation"
      subtitle="Create reservation linked to corporate account with special rates"
    >
      <form ref={formRef} onSubmit={handleSubmit(onFormSubmit)} className="max-w-4xl mx-auto space-y-6">
        
        {/* Company Selection Card */}
        <div className="bg-white border-2 border-orange-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
            <h2 className="text-sm font-bold text-orange-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>STEP 1: SELECT COMPANY</span>
            </h2>
          </div>
          
          <div className="p-6">
            {!selectedCompany ? (
              <div className="text-center py-8">
                <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-bold mb-4">
                  No company selected. Click below to search and select a company.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCompanyPopupOpen(true)}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Company</span>
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Selected Company</p>
                    <h3 className="text-2xl font-black text-orange-900 mb-2">
                      {selectedCompany.name}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-bold">Code:</span> {selectedCompany.company_code}</p>
                      <p><span className="font-bold">Location:</span> {selectedCompany.city}, {selectedCompany.country}</p>
                      {selectedCompany.email && <p><span className="font-bold">Email:</span> {selectedCompany.email}</p>}
                    </div>
                    <div className="mt-4 bg-green-100 border border-green-300 rounded px-3 py-2 inline-block">
                      <p className="text-sm font-bold text-green-800">
                        ✓ 15% Corporate Discount Applied
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompany(null);
                      toast.info("Company unlinked");
                    }}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guest Information */}
        <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
            <h2 className="text-sm font-bold text-blue-900 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>STEP 2: GUEST DETAILS</span>
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Guest Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter employee/guest name"
                {...register("guest_name", { required: "Guest name is required" })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base"
              />
              {errors.guest_name && (
                <p className="text-red-500 text-sm mt-1">{errors.guest_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  {...register("phone")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="guest@company.com"
                  {...register("email")}
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

        {/* Stay & Room Details */}
        <div className="bg-white border-2 border-green-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-green-50 px-4 py-3 border-b border-green-200">
            <h2 className="text-sm font-bold text-green-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>STEP 3: STAY DETAILS</span>
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Check-In <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("arrival")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Check-Out <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("departure")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nights</label>
                <input
                  type="number"
                  disabled
                  value={watchNights}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-100 font-bold text-lg text-center"
                />
              </div>
            </div>

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
                      {type.type_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Adults</label>
                <select
                  {...register("adults")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                >
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Children</label>
                <select
                  {...register("children")}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                >
                  {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n} Child{n !== 1 ? 'ren' : ''}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Information Accordion - Replaces Billing Summary */}
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

        {/* Actions */}
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
            disabled={!selectedCompany}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Create Company Reservation</span>
          </button>
        </div>
      </form>

      {/* Company Search Popup */}
      <SearchPopup
        isOpen={isCompanyPopupOpen}
        onClose={() => setIsCompanyPopupOpen(false)}
        title="Search Corporate Companies"
        items={companies}
        searchKeys={["company_code", "name", "city"]}
        columns={companyColumns}
        onSelect={(company) => {
          setSelectedCompany(company);
          setIsCompanyPopupOpen(false);
          toast.success(`Selected: ${company.name}`);
        }}
      />
    </PageWrapper>
  );
};

export default NewCompanyReservation;
