import React from "react";

export const PageWrapper = ({ children, title, subtitle, action }) => {
  return (
    <div
      id={`page-${title?.toLowerCase()?.replace(/\s+/g, "-")}`}
      className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 select-none bg-ids-bg"
    >
      {/* Page Header */}
      {(title || subtitle || action) && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b border-ids-border">
          <div className="mb-3 md:mb-0 min-w-0">
            {title && (
              <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-gray-800 leading-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs md:text-sm font-medium text-gray-500 font-sans mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 flex items-center space-x-2">{action}</div>}
        </div>
      )}

      {/* Main Page Content */}
      <div className="animate-fade-in w-full max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
