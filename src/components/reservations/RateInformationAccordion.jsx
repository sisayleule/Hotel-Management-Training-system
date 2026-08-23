import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, DollarSign, AlertCircle } from "lucide-react";

/**
 * RateInformationAccordion - Collapsible rate information panel with live calculations
 * 
 * Features:
 * - Collapsible accordion UI with smooth transitions
 * - Live calculation breakdown showing all charges
 * - Validation with auto-expand on errors
 * - Collapsed summary showing total when filled
 * - Currency formatting and symbol display
 */
export const RateInformationAccordion = ({
  // Form field values (controlled by parent form)
  roomType,
  rateCode,
  roomRate,
  nights,
  adults,
  children,
  mealPlan,
  currency,
  discountPercent,
  taxPercent,
  serviceChargePercent,
  
  // Form registration functions from react-hook-form
  register,
  setValue,
  errors,
  
  // Optional: external control of accordion state
  isExpanded: externalIsExpanded,
  onExpandChange
}) => {
  // Internal accordion state (can be overridden by external control)
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  
  // Debug log to verify component renders
  console.log('RateInformationAccordion rendered', { roomRate, nights });
  
  // Use external state if provided, otherwise use internal state
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  
  const handleToggle = () => {
    if (onExpandChange) {
      onExpandChange(!isExpanded);
    } else {
      setInternalIsExpanded(!isExpanded);
    }
  };

  // Auto-expand if there are validation errors in rate fields
  useEffect(() => {
    if (errors && Object.keys(errors).some(key => 
      ['rateCode', 'roomRate', 'nights', 'adults', 'children', 'mealPlan', 'currency', 
       'discountPercent', 'taxPercent', 'serviceChargePercent'].includes(key)
    )) {
      if (onExpandChange) {
        onExpandChange(true);
      } else {
        setInternalIsExpanded(true);
      }
    }
  }, [errors, onExpandChange]);

  // Live calculation based on the formula:
  // room_charge = room_rate × nights
  // discount_amount = room_charge × (discount_percent / 100)
  // after_discount = room_charge − discount_amount
  // tax_amount = after_discount × (tax_percent / 100)
  // service_charge_amount = after_discount × (service_charge_percent / 100)
  // total_amount = after_discount + tax_amount + service_charge_amount
  const calculations = useMemo(() => {
    const rate = Number(roomRate) || 0;
    const nightsCount = Number(nights) || 1;
    const discount = Number(discountPercent) || 0;
    const tax = Number(taxPercent) || 0;
    const serviceCharge = Number(serviceChargePercent) || 0;

    const roomCharge = rate * nightsCount;
    const discountAmount = roomCharge * (discount / 100);
    const afterDiscount = roomCharge - discountAmount;
    const taxAmount = afterDiscount * (tax / 100);
    const serviceChargeAmount = afterDiscount * (serviceCharge / 100);
    const totalAmount = afterDiscount + taxAmount + serviceChargeAmount;

    return {
      roomCharge,
      discountAmount,
      afterDiscount,
      taxAmount,
      serviceChargeAmount,
      totalAmount
    };
  }, [roomRate, nights, discountPercent, taxPercent, serviceChargePercent]);

  // Format currency based on selected currency
  const formatCurrency = (amount) => {
    const symbols = {
      'ETB': 'ETB',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹'
    };
    const symbol = symbols[currency] || currency || 'ETB';
    return `${symbol} ${amount.toFixed(2)}`;
  };

  // Collapsed summary text
  const collapsedSummary = useMemo(() => {
    if (calculations.totalAmount > 0) {
      return `Rate: ${formatCurrency(calculations.totalAmount)} (${nights || 1} night${nights > 1 ? 's' : ''})`;
    }
    return "Rate Information";
  }, [calculations.totalAmount, nights, currency]);

  return (
    <div className="bg-white border border-ids-border rounded overflow-hidden shadow-xs">
      {/* Accordion Header Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full bg-ids-sidebar text-white px-4 py-2 text-xs font-bold uppercase tracking-wider border-b border-ids-border flex items-center justify-between hover:bg-ids-header transition-colors"
      >
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4" />
          <span>{collapsedSummary}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 space-y-4">
          {/* Rate Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Rate Code */}
            <div>
              <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1">
                Rate Code *
              </label>
              <input
                type="text"
                placeholder="e.g., BAR, CORP, BB"
                {...register("rateCode", { 
                  required: "Rate code is required",
                  pattern: {
                    value: /^[A-Z0-9]+$/,
                    message: "Use uppercase letters and numbers only"
                  }
                })}
                className="w-full px-3 py-1.5 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header text-xs bg-gray-50 font-semibold uppercase"
              />
              {errors?.rateCode && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.rateCode.message}
                </p>
              )}
            </div>

            {/* Room Rate */}
            <div>
              <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1">
                Room Rate (per night) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("roomRate", { 
                  required: "Room rate is required",
                  min: { value: 0, message: "Rate cannot be negative" },
                  validate: value => !isNaN(value) || "Must be a valid number"
                })}
                className="w-full px-3 py-1.5 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header text-xs bg-gray-50 font-mono font-bold"
              />
              {errors?.roomRate && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.roomRate.message}
                </p>
              )}
            </div>

            {/* Meal Plan */}
            <div>
              <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1">
                Meal Plan
              </label>
              <select
                {...register("mealPlan")}
                className="w-full px-3 py-1.5 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header text-xs bg-gray-50 font-semibold"
              >
                <option value="RO">RO - Room Only</option>
                <option value="BB">BB - Bed & Breakfast</option>
                <option value="HB">HB - Half Board</option>
                <option value="FB">FB - Full Board</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1">
                Currency
              </label>
              <select
                {...register("currency")}
                className="w-full px-3 py-1.5 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header text-xs bg-gray-50 font-semibold"
              >
                <option value="ETB">ETB - Ethiopian Birr</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>

            {/* Discount Percent */}
            <div>
              <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                {...register("discountPercent", { 
                  min: { value: 0, message: "Cannot be negative" },
                  max: { value: 100, message: "Cannot exceed 100%" },
                  validate: value => {
                    if (value === "" || value === null || value === undefined) return true;
                    return !isNaN(value) || "Must be a valid number";
                  }
                })}
                className="w-full px-3 py-1.5 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header text-xs bg-gray-50 font-mono"
              />
              {errors?.discountPercent && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.discountPercent.message}
                </p>
              )}
            </div>

            {/* Tax Percent */}
            <div>
              <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1">
                Tax (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                {...register("taxPercent", { 
                  min: { value: 0, message: "Cannot be negative" },
                  max: { value: 100, message: "Cannot exceed 100%" },
                  validate: value => {
                    if (value === "" || value === null || value === undefined) return true;
                    return !isNaN(value) || "Must be a valid number";
                  }
                })}
                className="w-full px-3 py-1.5 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header text-xs bg-gray-50 font-mono"
              />
              {errors?.taxPercent && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.taxPercent.message}
                </p>
              )}
            </div>

            {/* Service Charge Percent */}
            <div>
              <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1">
                Service Charge (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                {...register("serviceChargePercent", { 
                  min: { value: 0, message: "Cannot be negative" },
                  max: { value: 100, message: "Cannot exceed 100%" },
                  validate: value => {
                    if (value === "" || value === null || value === undefined) return true;
                    return !isNaN(value) || "Must be a valid number";
                  }
                })}
                className="w-full px-3 py-1.5 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header text-xs bg-gray-50 font-mono"
              />
              {errors?.serviceChargePercent && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.serviceChargePercent.message}
                </p>
              )}
            </div>
          </div>

          {/* Live Calculation Breakdown */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Live Calculation Breakdown
            </h4>
            
            <div className="space-y-1.5 text-xs font-mono">
              {/* Room Charge */}
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 font-semibold">
                  Room Charge ({formatCurrency(Number(roomRate) || 0)} × {nights || 1} night{nights > 1 ? 's' : ''})
                </span>
                <span className="font-bold text-gray-800">
                  {formatCurrency(calculations.roomCharge)}
                </span>
              </div>

              {/* Discount */}
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between items-center py-1 text-red-600">
                  <span className="font-semibold">
                    Discount ({discountPercent || 0}%)
                  </span>
                  <span className="font-bold">
                    - {formatCurrency(calculations.discountAmount)}
                  </span>
                </div>
              )}

              {/* Subtotal after discount */}
              <div className="flex justify-between items-center py-1 border-t border-gray-300 pt-2">
                <span className="text-gray-700 font-bold">
                  Subtotal after Discount
                </span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(calculations.afterDiscount)}
                </span>
              </div>

              {/* Tax */}
              {calculations.taxAmount > 0 && (
                <div className="flex justify-between items-center py-1 text-blue-600">
                  <span className="font-semibold">
                    Tax ({taxPercent || 0}%)
                  </span>
                  <span className="font-bold">
                    + {formatCurrency(calculations.taxAmount)}
                  </span>
                </div>
              )}

              {/* Service Charge */}
              {calculations.serviceChargeAmount > 0 && (
                <div className="flex justify-between items-center py-1 text-blue-600">
                  <span className="font-semibold">
                    Service Charge ({serviceChargePercent || 0}%)
                  </span>
                  <span className="font-bold">
                    + {formatCurrency(calculations.serviceChargeAmount)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center py-2 border-t-2 border-gray-400 mt-2 bg-white rounded px-2">
                <span className="text-gray-900 font-black uppercase text-sm">
                  Total Amount
                </span>
                <span className="font-black text-green-700 text-lg">
                  {formatCurrency(calculations.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Calculation Formula Reference */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
              <span className="font-bold">Formula:</span> Room Charge = Rate × Nights → Discount Applied → Tax & Service Charge Added to Subtotal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateInformationAccordion;
