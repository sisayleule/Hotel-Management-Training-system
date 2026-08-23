import React from "react";

export const LoadingSpinner = ({ message = "Loading data..." }) => {
  return (
    <div id="loading-spinner" className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-ids-border/30"></div>
        <div className="absolute inset-0 rounded-full border-4 border-ids-header border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-gray-500 font-sans">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
