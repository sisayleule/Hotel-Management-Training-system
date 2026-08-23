import React, { useEffect } from "react";
import { X } from "lucide-react";

export const BottomSheet = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="bottom-sheet-container"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        id="bottom-sheet-content"
        className="bg-white border-t sm:border border-ids-border w-full sm:max-w-md rounded-t-xl sm:rounded-lg shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden transform transition-transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for dragging on mobile */}
        <div className="sm:hidden flex justify-center py-2 bg-gray-50 border-b border-gray-100">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="bg-ids-header text-ids-header-text px-4 py-3 flex items-center justify-between border-b border-ids-border">
          <h3 className="font-semibold text-base font-sans tracking-wide truncate">{title}</h3>
          <button
            id="bottom-sheet-close-btn"
            onClick={onClose}
            className="text-ids-header-text hover:bg-ids-sidebar-hover/30 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 safe-padding-bottom">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
