import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const ReasonModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  studentName,
  actionType, // 'approve' or 'reject'
  loading 
}) => {
  const [reason, setReason] = useState('');
  const textareaRef = useRef(null);

  // Reset reason when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      // Focus textarea after modal opens
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim().length >= 3) {
      onSubmit(reason.trim());
    }
  };

  if (!isOpen) return null;

  const isValid = reason.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between ${
          actionType === 'approve' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <h3 className={`text-lg font-bold ${
            actionType === 'approve' ? 'text-green-900' : 'text-red-900'
          }`}>
            {title}
          </h3>
          {!loading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-700">
              You are about to <span className={`font-semibold ${
                actionType === 'approve' ? 'text-green-600' : 'text-red-600'
              }`}>
                {actionType}
              </span> <span className="font-semibold">{studentName}</span>.
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add a note <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={textareaRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  actionType === 'approve' 
                    ? 'e.g., "Verified enrollment documents"' 
                    : 'e.g., "Missing required documents"'
                }
                rows={4}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ids-header focus:border-transparent resize-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Minimum 3 characters required
                </p>
                <p className={`text-xs font-medium ${
                  reason.trim().length >= 3 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {reason.trim().length} / 3
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReasonModal;
