import React from "react";

export const StatCard = ({ title, value, icon: Icon, onClick, className = "" }) => {
  return (
    <div
      id={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      onClick={onClick}
      className={`bg-white border border-ids-border p-4 rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between ${className}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate mb-1">
          {title}
        </p>
        <p className="text-3xl font-mono font-bold text-orange-600 transition-colors">
          {value}
        </p>
      </div>
      {Icon && (
        <div className="ml-4 p-2 bg-slate-50 border border-ids-border rounded text-ids-header shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
