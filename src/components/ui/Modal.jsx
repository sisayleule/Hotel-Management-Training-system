import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, children, maxWidthClass = "max-w-lg" }) => {
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
      id="modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        id="modal-content"
        className={`bg-ids-bg border border-ids-border w-full ${maxWidthClass} rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-ids-header text-ids-header-text px-4 py-3 flex items-center justify-between border-b border-ids-border">
          <h3 className="font-semibold text-lg font-sans tracking-wide">{title}</h3>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="text-ids-header-text hover:bg-ids-sidebar-hover/30 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-white text-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
