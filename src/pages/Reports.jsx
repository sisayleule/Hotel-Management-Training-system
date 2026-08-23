import React, { useState } from "react";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { 
  FileSpreadsheet, ClipboardList, LogIn, LogOut, 
  Home, BarChart3, ChevronRight, Sparkles 
} from "lucide-react";

// Sub-Reports Components
import GuestBlockReport from "../components/reports/GuestBlockReport.jsx";
import ArrivalReport from "../components/reports/ArrivalReport.jsx";
import DepartureReport from "../components/reports/DepartureReport.jsx";
import InhouseReport from "../components/reports/InhouseReport.jsx";
import RoomStatusReport from "../components/reports/RoomStatusReport.jsx";
import RevenueReport from "../components/reports/RevenueReport.jsx";

export const Reports = () => {
  const [activeReport, setActiveReport] = useState(null);

  // List of reports available in the hub
  const reportCards = [
    {
      id: "gstblk",
      title: "Detailed Position (GSTBLK)",
      code: "PMS.FO.GSTBLK",
      desc: "Audit blocked, held, and maintenance rooms with department stamps.",
      icon: ClipboardList,
      color: "border-l-orange-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50/50"
    },
    {
      id: "arrivals",
      title: "Expected Arrivals List",
      code: "PMS.FO.ARRIVALS",
      desc: "Expected daily checking-in arrivals list, rates, and advance payments.",
      icon: LogIn,
      color: "border-l-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50/50"
    },
    {
      id: "departures",
      title: "Expected Departures List",
      code: "PMS.FO.DEPARTURES",
      desc: "Departures tracking, overdue checkouts, outstanding folios, and keys clearances.",
      icon: LogOut,
      color: "border-l-rose-500",
      textColor: "text-rose-600",
      bgColor: "bg-rose-50/50"
    },
    {
      id: "inhouse",
      title: "In-House Guest Registry",
      code: "PMS.FO.INHOUSE",
      desc: "Live list of checked-in stays, occupancy rates, and outstanding ledger totals.",
      icon: Home,
      color: "border-l-indigo-500",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50/50"
    },
    {
      id: "room_status",
      title: "Room Status & Cleanliness",
      code: "PMS.HK.STATUS",
      desc: "Room-by-room cleanliness ratios, category allocations, and floor statistics.",
      icon: Sparkles,
      color: "border-l-teal-500",
      textColor: "text-teal-600",
      bgColor: "bg-teal-50/50"
    },
    {
      id: "revenue",
      title: "Revenue & Yield Charts",
      code: "PMS.FIN.REVENUE",
      desc: "Dynamic charts tracking collected revenues, outstanding folios, and ADR ratios.",
      icon: BarChart3,
      color: "border-l-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50/50"
    }
  ];

  const handleBack = () => {
    setActiveReport(null);
  };

  return (
      <PageWrapper
        title="Property Audits & Reports Hub"
        subtitle="Access auditable lodging statistics, dynamic night-shift registers, and financial yields analytics"
      >
        <div className="space-y-6">
          
          {/* Main Dashboard view */}
          {!activeReport ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    onClick={() => setActiveReport(card.id)}
                    className={`bg-white border border-ids-border border-l-4 ${card.color} rounded-lg p-4 cursor-pointer hover:shadow-md transition-all select-none flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-gray-400">
                          {card.code}
                        </span>
                        <div className={`p-1.5 rounded-full ${card.bgColor} ${card.textColor}`}>
                          <Icon className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-sans font-black text-slate-800 text-xs uppercase tracking-wide">
                          {card.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-sans font-medium">
                          {card.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center text-[10px] font-bold text-ids-sidebar hover:text-ids-sidebar-hover space-x-1 font-mono pt-2 border-t border-slate-100 uppercase">
                      <span>Generate Audit Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Individual Report Rendering */
            <div className="bg-slate-50 border border-ids-border p-5 rounded-lg shadow-3xs animate-scale-in">
              {activeReport === "gstblk" && <GuestBlockReport onBack={handleBack} />}
              {activeReport === "arrivals" && <ArrivalReport onBack={handleBack} />}
              {activeReport === "departures" && <DepartureReport onBack={handleBack} />}
              {activeReport === "inhouse" && <InhouseReport onBack={handleBack} />}
              {activeReport === "room_status" && <RoomStatusReport onBack={handleBack} />}
              {activeReport === "revenue" && <RevenueReport onBack={handleBack} />}
            </div>
          )}

        </div>
      </PageWrapper>
  );
};

export default Reports;
