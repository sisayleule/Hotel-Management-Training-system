import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50 font-sans select-none text-xs">
      <div className="bg-white border border-ids-border p-8 rounded-lg shadow-md max-w-sm w-full text-center space-y-5">
        <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-200">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider">404 - Page Not Found</h2>
          <p className="text-gray-500 leading-relaxed">
            The requested PMS screen or audit module does not exist in our training system.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-1.5 border border-ids-border hover:bg-gray-50 text-slate-700 font-bold rounded bg-white flex items-center justify-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-1.5 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white font-bold rounded transition-all flex items-center justify-center space-x-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
