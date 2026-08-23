import React from "react";
import { X, UserCheck, UserPlus, AlertTriangle } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

/**
 * DuplicateGuestModal - Shown when a guest name matches an existing record
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {function} props.onClose - Close handler (not used - user must choose an option)
 * @param {Object} props.existingGuest - The matched guest from the database
 * @param {string} props.enteredName - The name the user entered
 * @param {function} props.onContinueExisting - Handler for using existing guest record
 * @param {function} props.onCreateNew - Handler for creating new guest record
 */
export const DuplicateGuestModal = ({
  isOpen,
  onClose,
  existingGuest,
  enteredName,
  onContinueExisting,
  onCreateNew
}) => {
  if (!isOpen) return null;

  // Format last stay date if available
  const formatLastStay = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = parseISO(dateStr);
      if (!isValid(d)) return dateStr;
      return format(d, "dd-MMM-yyyy").toUpperCase();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border-2 border-amber-500 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-100 border-b-2 border-amber-500 px-4 py-3 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider flex-1">
            Duplicate Guest Name Detected
          </h3>
          {/* No close button - user must choose an option */}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-300 rounded p-3">
            <p className="text-xs font-bold text-amber-900 leading-relaxed">
              A guest named <span className="font-black text-amber-700">"{enteredName}"</span> already exists in the system.
            </p>
            <p className="text-[11px] text-amber-800 mt-2">
              Please review the details below and choose whether to use the existing guest record or create a new one.
            </p>
          </div>

          {/* Existing Guest Details */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
              <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                Existing Guest Record
              </h4>
            </div>
            <div className="p-3 space-y-2 bg-white">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-500 font-bold block">Guest ID:</span>
                  <span className="text-gray-900 font-mono font-bold">{existingGuest.guest_id || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-bold block">Rating:</span>
                  <span className="text-gray-900 font-bold">{existingGuest.rating || "N/A"}</span>
                </div>
              </div>

              <div className="text-[11px]">
                <span className="text-gray-500 font-bold block">Email:</span>
                <span className="text-gray-900 font-mono">{existingGuest.email || "Not provided"}</span>
              </div>

              <div className="text-[11px]">
                <span className="text-gray-500 font-bold block">Phone:</span>
                <span className="text-gray-900 font-mono">{existingGuest.phone || "Not provided"}</span>
              </div>

              <div className="text-[11px]">
                <span className="text-gray-500 font-bold block">Location:</span>
                <span className="text-gray-900">
                  {[existingGuest.city, existingGuest.state, existingGuest.country]
                    .filter(Boolean)
                    .join(", ") || "Not provided"}
                </span>
              </div>

              {existingGuest.identity_type && existingGuest.identity_no && (
                <div className="text-[11px]">
                  <span className="text-gray-500 font-bold block">Identity:</span>
                  <span className="text-gray-900">
                    {existingGuest.identity_type}: {existingGuest.identity_no}
                  </span>
                </div>
              )}

              {existingGuest.last_stay && (
                <div className="text-[11px]">
                  <span className="text-gray-500 font-bold block">Last Stay:</span>
                  <span className="text-gray-900 font-mono font-bold">
                    {formatLastStay(existingGuest.last_stay)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Decision Prompt */}
          <div className="bg-blue-50 border border-blue-300 rounded p-3">
            <p className="text-[11px] font-bold text-blue-900 leading-relaxed">
              Is this the same person, or someone different with the same name?
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-5 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onContinueExisting}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Continue with Existing Guest</span>
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] rounded tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Guest Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateGuestModal;
