import React, { useState } from "react";
import { AlertTriangle, RefreshCw, X, CheckSquare } from "lucide-react";
import { useHotelStore } from "../../store/useHotelStore.js";
import { useEnterAsTab } from "../../hooks/useEnterAsTab.js";
import toast from "react-hot-toast";

export const DemoResetModal = ({ isOpen, onClose, onResetComplete }) => {
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const resetToDemo = useHotelStore((state) => state.resetToDemo);

  const formRef = useEnterAsTab({ onSubmit: (e) => handleResetSubmit(e) });

  if (!isOpen) return null;

  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (confirmText !== "RESET") return;

    setIsResetting(true);

    // Simulate real system database reset process for realistic PMS feel
    setTimeout(() => {
      resetToDemo();
      setIsResetting(false);
      setConfirmText("");
      toast.success("Demo database reset successfully! All clean for next student.");
      onResetComplete();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in select-none font-sans">
      <div className="bg-white border border-ids-border rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4.5 h-4.5" />
            <span className="font-bold text-xs uppercase tracking-wider">Reset Demo Training Data</span>
          </div>
          <button 
            onClick={onClose}
            disabled={isResetting}
            className="text-white/80 hover:text-white transition-all disabled:opacity-40"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">Warning: Permanent System Reset</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                You are about to restore the local database to its factory default training values. Any changes made during this practice session will be lost.
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-slate-50 border border-ids-border/50 rounded p-3.5 space-y-2">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">This will restore & clear:</p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex items-center space-x-2">
                <CheckSquare className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Revert all rooms back to default cleanliness and statuses</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckSquare className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Reset 15 default training reservations and checkout states</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckSquare className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Clear guest ledger payments & folio transactions</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckSquare className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Re-assign original hotel staff roles & shifts</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckSquare className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Flush all maintenance & housekeeping request logs</span>
              </li>
            </ul>
          </div>

          {/* Action Form */}
          <form ref={formRef} onSubmit={handleResetSubmit} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                Type <span className="text-red-600 font-bold">RESET</span> to confirm *
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isResetting}
                placeholder="Enter confirmation text..."
                className="w-full px-3 py-2 border border-ids-border rounded font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                required
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isResetting}
                className="flex-1 py-2 border border-ids-border rounded font-bold text-xs text-gray-600 hover:bg-gray-100 transition-all bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={confirmText !== "RESET" || isResetting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-all shadow-2xs flex items-center justify-center space-x-1.5 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging System...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Purge & Reset</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default DemoResetModal;
