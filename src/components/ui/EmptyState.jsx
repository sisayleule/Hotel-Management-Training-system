import React from "react";
import { Info } from "lucide-react";

export const EmptyState = ({ title = "No data found", description = "There is no information to display here.", icon: Icon = Info }) => {
  return (
    <div id="empty-state" className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-ids-border/60 bg-white rounded-lg">
      <div className="p-3 bg-ids-bg rounded-full text-ids-header mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-gray-700 text-sm font-sans mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm font-sans">{description}</p>
    </div>
  );
};

export default EmptyState;
