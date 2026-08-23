import React, { useState, useEffect } from 'react';
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

export const RateAccordion = ({
  roomRate,
  setRoomRate,
  nights,
  rateCode,
  setRateCode,
  mealPlan,
  setMealPlan,
  currency,
  setCurrency,
  discountPercent,
  setDiscountPercent,
  taxPercent,
  setTaxPercent,
  serviceChargePercent,
  setServiceChargePercent,
  totalAmount,
  setTotalAmount,
  errors = {},
  setErrors = () => {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [breakdown, setBreakdown] = useState({
    roomCharge: 0,
    discountAmount: 0,
    afterDiscount: 0,
    taxAmount: 0,
    serviceChargeAmount: 0,
    total: 0
  });

  // Calculate breakdown whenever inputs change
  useEffect(() => {
    calculateBreakdown();
  }, [roomRate, nights, discountPercent, taxPercent, serviceChargePercent]);

  // Auto-expand if there are errors
  useEffect(() => {
    if (Object.keys(errors).length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [errors]);

  const calculateBreakdown = () => {
    const rate = parseFloat(roomRate) || 0;
    const nightsNum = parseInt(nights) || 1;
    const discount = parseFloat(discountPercent) || 0;
    const tax = parseFloat(taxPercent) || 0;
    const serviceCharge = parseFloat(serviceChargePercent) || 0;

    // Formula: room_charge → discount → tax → service_charge → total
    const roomCharge = rate * nightsNum;
    const discountAmount = roomCharge * (discount / 100);
    const afterDiscount = roomCharge - discountAmount;
    const taxAmount = afterDiscount * (tax / 100);
    const serviceChargeAmount = afterDiscount * (serviceCharge / 100);
    const total = afterDiscount + taxAmount + serviceChargeAmount;

    const newBreakdown = {
      roomCharge: roomCharge,
      discountAmount: discountAmount,
      afterDiscount: afterDiscount,
      taxAmount: taxAmount,
      serviceChargeAmount: serviceChargeAmount,
      total: total
    };

    setBreakdown(newBreakdown);
    setTotalAmount(total);
  };

  const formatCurrency = (amount) => {
    const symbol = currency === 'USD' ? '$' : 'ETB ';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const validateNumber = (value, fieldName) => {
    if (value === '' || value === null || value === undefined) {
      return true; // Allow empty (will be treated as 0)
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Must be a valid number' }));
      return false;
    }
    if (num < 0) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Cannot be negative' }));
      return false;
    }
    
    // Clear error if valid
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    return true;
  };

  const handleRoomRateChange = (e) => {
    const value = e.target.value;
    setRoomRate(value);
    validateNumber(value, 'roomRate');
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    setDiscountPercent(value);
    validateNumber(value, 'discountPercent');
  };

  const handleTaxChange = (e) => {
    const value = e.target.value;
    setTaxPercent(value);
    validateNumber(value, 'taxPercent');
  };

  const handleServiceChargeChange = (e) => {
    const value = e.target.value;
    setServiceChargePercent(value);
    validateNumber(value, 'serviceChargePercent');
  };

  const getSummary = () => {
    if (!roomRate || roomRate === '0' || roomRate === '') {
      return '';
    }
    return ` ${formatCurrency(breakdown.total)} (${nights} ${nights === 1 ? 'night' : 'nights'})`;
  };

  return (
    <div className="bg-white border border-ids-border rounded-lg overflow-hidden">
      {/* Accordion Header / Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-ids-header" />
          <span className="font-bold text-sm text-gray-900">
            Rate Information
            {getSummary() && (
              <span className="font-semibold text-ids-header ml-2">
                {getSummary()}
              </span>
            )}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Accordion Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 space-y-4 border-t border-gray-200">
          {/* Row 1: Room Type, Rate Code, Meal Plan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Rate Code
              </label>
              <select
                value={rateCode}
                onChange={(e) => setRateCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ids-header text-sm"
              >
                <option value="BAR">BAR (Best Available Rate)</option>
                <option value="CORP">CORP (Corporate Rate)</option>
                <option value="BB">BB (Bed & Breakfast)</option>
                <option value="GOVT">GOVT (Government Rate)</option>
                <option value="PKG">PKG (Package Rate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Meal Plan
              </label>
              <select
                value={mealPlan}
                onChange={(e) => setMealPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ids-header text-sm"
              >
                <option value="RO">RO (Room Only)</option>
                <option value="BB">BB (Bed & Breakfast)</option>
                <option value="HB">HB (Half Board)</option>
                <option value="FB">FB (Full Board)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ids-header text-sm"
              >
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Room Rate, Discount, Tax, Service Charge */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Room Rate <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={roomRate}
                onChange={handleRoomRateChange}
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-ids-header text-sm ${
                  errors.roomRate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.roomRate && (
                <p className="text-xs text-red-500 mt-1">{errors.roomRate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Discount %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discountPercent}
                onChange={handleDiscountChange}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-ids-header text-sm ${
                  errors.discountPercent ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.discountPercent && (
                <p className="text-xs text-red-500 mt-1">{errors.discountPercent}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tax %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxPercent}
                onChange={handleTaxChange}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-ids-header text-sm ${
                  errors.taxPercent ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.taxPercent && (
                <p className="text-xs text-red-500 mt-1">{errors.taxPercent}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Service Charge %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={serviceChargePercent}
                onChange={handleServiceChargeChange}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-ids-header text-sm ${
                  errors.serviceChargePercent ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.serviceChargePercent && (
                <p className="text-xs text-red-500 mt-1">{errors.serviceChargePercent}</p>
              )}
            </div>
          </div>

          {/* Breakdown Display */}
          <div className="bg-gray-50 rounded-lg p-4 mt-4 border border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">
              Rate Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Room Charge ({nights} {nights === 1 ? 'night' : 'nights'} × {formatCurrency(parseFloat(roomRate) || 0)})</span>
                <span className="font-semibold">{formatCurrency(breakdown.roomCharge)}</span>
              </div>
              
              {breakdown.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-semibold">- {formatCurrency(breakdown.discountAmount)}</span>
                </div>
              )}
              
              {(breakdown.discountAmount > 0 || breakdown.taxAmount > 0 || breakdown.serviceChargeAmount > 0) && (
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-700">Subtotal After Discount</span>
                  <span className="font-semibold">{formatCurrency(breakdown.afterDiscount)}</span>
                </div>
              )}
              
              {breakdown.taxAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Tax ({taxPercent}%)</span>
                  <span className="font-semibold">+ {formatCurrency(breakdown.taxAmount)}</span>
                </div>
              )}
              
              {breakdown.serviceChargeAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Service Charge ({serviceChargePercent}%)</span>
                  <span className="font-semibold">+ {formatCurrency(breakdown.serviceChargeAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between pt-2 mt-2 border-t-2 border-gray-400 text-base">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-bold text-ids-header">{formatCurrency(breakdown.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateAccordion;
