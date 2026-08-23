import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  studentName,
  loading 
}) => {
  const [confirmText, setConfirmText] = useState('');
  const inputRef = useRef(null);

  // Reset confirmation text when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
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
    if (confirmText === 'DELETE') {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  const isValid = confirmText === 'DELETE';

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
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-red-900">
              Delete Student Account
            </h3>
          </div>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold mb-2">
                ⚠️ Warning: This action cannot be easily reversed!
              </p>
              <p className="text-sm text-red-700">
                You are about to soft-delete <span className="font-semibold">{studentName}</span>'s account. 
                The account will be hidden from all views but preserved for audit purposes.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-red-600">DELETE</span> to confirm
              </label>
              <input
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {confirmText && confirmText !== 'DELETE' && (
                <p className="text-xs text-red-500 mt-1">
                  Must type exactly "DELETE" (all capitals)
                </p>
              )}
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
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
