import React from "react";
import { AlertTriangle, User, Phone, Mail, Calendar } from "lucide-react";

/**
 * DuplicateGuestDialog - Confirmation dialog when a guest name already exists
 * 
 * Shows existing guest details and allows user to:
 * - Continue: Reuse existing guest record
 * - Create New: Create a separate guest record with the same name
 */
export const DuplicateGuestDialog = ({
  isOpen,
  guestName,
  existingGuest,
  onContinue,
  onCreateNew,
}) => {
  if (!isOpen) return null;

  // Prevent closing by clicking outside
  const handleBackdropClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-orange-500 text-white px-6 py-4 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-bold">Duplicate Guest Name Detected</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
            <p className="text-gray-800 font-semibold text-lg mb-2">
              A guest named <span className="text-orange-700 font-black">"{guestName}"</span> already exists in the system.
            </p>
            <p className="text-gray-700 text-sm">
              Please review the existing guest details below and decide whether this is the same person or a different guest with the same name.
            </p>
          </div>

          {/* Existing Guest Details */}
          <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
              <h3 className="text-sm font-bold text-blue-900 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>EXISTING GUEST DETAILS</span>
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Guest Name */}
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Full Name</p>
                  <p className="text-base font-bold text-gray-900">{existingGuest.guest_name}</p>
                </div>
              </div>

              {/* Contact Information */}
              {existingGuest.phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Phone Number</p>
                    <p className="text-base text-gray-900">{existingGuest.phone}</p>
                  </div>
                </div>
              )}

              {existingGuest.email && (
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Email Address</p>
                    <p className="text-base text-gray-900">{existingGuest.email}</p>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                {existingGuest.city && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">City</p>
                    <p className="text-sm text-gray-900">{existingGuest.city}</p>
                  </div>
                )}
                {existingGuest.country && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Country</p>
                    <p className="text-sm text-gray-900">{existingGuest.country}</p>
                  </div>
                )}
                {existingGuest.identity_type && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">ID Type</p>
                    <p className="text-sm text-gray-900">{existingGuest.identity_type}</p>
                  </div>
                )}
                {existingGuest.identity_no && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">ID Number</p>
                    <p className="text-sm text-gray-900">{existingGuest.identity_no}</p>
                  </div>
                )}
              </div>

              {existingGuest.guest_id && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-bold uppercase">Guest ID</p>
                  <p className="text-sm text-gray-900 font-mono">{existingGuest.guest_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Decision Prompt */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-gray-800 font-bold mb-2">What would you like to do?</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <span><span className="font-bold">Continue with Existing Guest:</span> Link this reservation to the existing guest record above (recommended if this is the same person)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><span className="font-bold">Create New Guest:</span> Create a separate guest record with a new ID (use this if this is a different person who happens to have the same name)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-300 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCreateNew}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-colors flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Create New Guest</span>
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition-colors flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Continue with Existing</span>
          </button>
        </div>

        {/* Warning Footer */}
        <div className="bg-yellow-50 border-t-2 border-yellow-300 px-6 py-3">
          <p className="text-xs text-gray-700 text-center">
            <span className="font-bold">Note:</span> You must choose one of the options above to proceed. This dialog will not close until you make a selection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DuplicateGuestDialog;
