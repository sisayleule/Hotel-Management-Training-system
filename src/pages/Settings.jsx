import React, { useState } from "react";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { useHotelStore } from "../store/useHotelStore.js";
import { DemoResetModal } from "../components/settings/DemoResetModal.jsx";
import RoleSwitcher from "../components/settings/RoleSwitcher.jsx";
import { BookOpen, RefreshCw, ShieldAlert, Eye, EyeOff, Key } from "lucide-react";
import toast from "react-hot-toast";

export const Settings = () => {
  const { tutorialMode, setTutorialMode } = useHotelStore();

  const [activeTab, setActiveTab] = useState("roles");
  const [isResetOpen, setIsResetOpen] = useState(false);

  const tabs = [
    { id: "roles",    label: "Demo Role Switcher",  icon: Key },
    { id: "training", label: "Training & Reset",     icon: BookOpen },
  ];

  return (
    <PageWrapper
      title="PMS System Configurations"
      subtitle="Switch training roles or manage tutorial and reset options"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 select-none font-sans text-xs text-gray-800">

        {/* Left Tab Navigation */}
        <div className="md:col-span-3 space-y-1.5 flex flex-col">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-2.5 px-4 rounded text-left font-bold transition-all flex items-center space-x-2 border border-transparent ${
                  activeTab === tab.id
                    ? "bg-ids-sidebar text-white shadow-2xs"
                    : "bg-white border-ids-border hover:bg-gray-100 text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-9 bg-white border border-ids-border rounded-lg p-5 shadow-xs min-h-[50vh]">

          {/* Tab 1: Role Switcher */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <RoleSwitcher />
            </div>
          )}

          {/* Tab 2: Training & Reset */}
          {activeTab === "training" && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="font-black text-slate-800 uppercase text-[10px]">Academic Training Controls</h3>
                <p className="text-[10px] text-gray-400">Manage tutorial assistance panels and reset testing sandboxes.</p>
              </div>

              {/* Tutorial mode toggler */}
              <div className="bg-slate-50 border border-ids-border p-4 rounded-lg flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <h4 className="font-bold text-slate-800 text-xs">Interactive Tutorial Guidance Advice</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    When active, reveals explanatory badges above input labels to teach students standard hotel industry jargon and parameters.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTutorialMode(!tutorialMode);
                    toast.success(tutorialMode ? "Tutorial advice hidden." : "Tutorial advice enabled!");
                  }}
                  className={`px-4 py-2 font-bold text-xs rounded transition-all shrink-0 flex items-center space-x-1 ${
                    tutorialMode
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-2xs"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-ids-border"
                  }`}
                >
                  {tutorialMode ? (
                    <><Eye className="w-4 h-4" /><span>Advice Enabled</span></>
                  ) : (
                    <><EyeOff className="w-4 h-4" /><span>Advice Hidden</span></>
                  )}
                </button>
              </div>

              {/* Danger Zone: reset database */}
              <div className="border border-red-200 bg-red-50/25 p-4 rounded-lg space-y-3">
                <div className="flex items-center space-x-2 text-red-600">
                  <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
                  <span className="font-black uppercase text-[10px] tracking-wider">Danger Zone: Purge Database</span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Permanently clear guest checks, checkout history, reservation edits, and reset cleanliness schedules back to default curriculum parameters.
                </p>
                <button
                  onClick={() => setIsResetOpen(true)}
                  className="py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-sm flex items-center space-x-1.5 text-xs transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Purge & Reinitialize Database</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <DemoResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onResetComplete={() => setActiveTab("roles")}
      />
    </PageWrapper>
  );
};

export default Settings;
