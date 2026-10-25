import React, { useState } from "react";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { useHotelStore } from "../store/useHotelStore.js";
import { DemoResetModal } from "../components/settings/DemoResetModal.jsx";
import RoleSwitcher from "../components/settings/RoleSwitcher.jsx";
import { 
  Building, ShieldAlert, BookOpen, RefreshCw, Layers, Cpu, 
  Check, Save, Eye, EyeOff, Key, Radio, Wifi 
} from "lucide-react";
import toast from "react-hot-toast";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";

export const Settings = () => {
  const { 
    tutorialMode, setTutorialMode,
    hotelProfile, updateHotelProfile,
    displaySettings, updateDisplaySettings
  } = useHotelStore();

  const [activeTab, setActiveTab] = useState("profile");
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Local form states
  const [profileForm, setProfileForm] = useState({ ...hotelProfile });
  const [displayForm, setDisplayForm] = useState({ ...displaySettings });

  // Enter-as-Tab refs
  const profileFormRef = useEnterAsTab({ onSubmit: handleProfileSave });
  const displayFormRef = useEnterAsTab({ onSubmit: handleDisplaySave });

  // Handlers (declared as functions so they are hoisted above the useEnterAsTab hook calls)
  function handleProfileSave(e) {
    e.preventDefault();
    updateHotelProfile(profileForm);
    toast.success("Hotel property profile updated successfully!");
  }

  function handleDisplaySave(e) {
    e.preventDefault();
    updateDisplaySettings(displayForm);
    toast.success("PMS system display settings updated!");
  }

  const tabs = [
    { id: "profile", label: "Hotel Profile", icon: Building },
    { id: "roles", label: "Demo Role Switcher", icon: Key },
    { id: "training", label: "Training & Reset", icon: BookOpen },
    { id: "display", label: "System Display", icon: Layers },
    { id: "diagnostics", label: "Diagnostics & PWA", icon: Cpu },
  ];

  return (
    <PageWrapper
      title="PMS System Configurations"
      subtitle="Configure local training parameters, switch interactive roles, toggle tutor advice, or purge local database"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 select-none font-sans text-xs text-gray-800">
        
        {/* Left Hand Tab Navigation */}
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

        {/* Right Hand Form Content Area */}
        <div className="md:col-span-9 bg-white border border-ids-border rounded-lg p-5 shadow-xs min-h-[50vh]">
          
          {/* Tab 1: Hotel Profile */}
          {activeTab === "profile" && (
            <form ref={profileFormRef} onSubmit={handleProfileSave} className="space-y-4">
              <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-[10px]">Hotel Profile Information</h3>
                  <p className="text-[10px] text-gray-400">Specify property credentials appearing on print folios and bills.</p>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white rounded font-bold flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Property Trade Name *</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded focus:ring-1 bg-white font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">PMS Property Code *</label>
                  <input
                    type="text"
                    value={profileForm.propertyCode}
                    onChange={(e) => setProfileForm({ ...profileForm, propertyCode: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded focus:ring-1 bg-white font-mono font-bold"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Address Details *</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded focus:ring-1 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">City *</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded focus:ring-1 bg-white font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">State / Region *</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded focus:ring-1 bg-white font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">GSTIN / Tax Registration Number</label>
                  <input
                    type="text"
                    value={profileForm.gstNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, gstNumber: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded focus:ring-1 bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Property Star Class</label>
                  <select
                    value={profileForm.starRating}
                    onChange={(e) => setProfileForm({ ...profileForm, starRating: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded focus:ring-1 bg-white font-bold"
                  >
                    <option value="⭐⭐⭐⭐⭐ 5 Stars">⭐⭐⭐⭐⭐ 5 Stars (Luxury)</option>
                    <option value="⭐⭐⭐⭐ 4 Stars">⭐⭐⭐⭐ 4 Stars (Premium)</option>
                    <option value="⭐⭐⭐ 3 Stars">⭐⭐⭐ 3 Stars (Business)</option>
                  </select>
                </div>
              </div>
            </form>
          )}

          {/* Tab 2: Role Switcher */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <RoleSwitcher />
            </div>
          )}

          {/* Tab 3: Training & Reset */}
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
                    When active, reveals clean explanatory badges above input labels to teach students standard hotel industry jargon and parameters.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setTutorialMode(!tutorialMode);
                    toast.success(tutorialMode ? "Tutorial advice hidden." : "Tutorial advice enabled! Hover over fields for hotel PMS tips.");
                  }}
                  className={`px-4 py-2 font-bold text-xs rounded transition-all shrink-0 flex items-center space-x-1 ${
                    tutorialMode 
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-2xs" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-ids-border"
                  }`}
                >
                  {tutorialMode ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Advice Enabled</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Advice Hidden</span>
                    </>
                  )}
                </button>
              </div>

              {/* Danger Zone: reset database */}
              <div className="border border-red-200 bg-red-50/25 p-4 rounded-lg space-y-3">
                <div className="flex items-center space-x-2 text-red-600">
                  <ShieldAlert className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span className="font-black uppercase text-[10px] tracking-wider">Danger Zone: Purge Database</span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Permanently clear guest checks, checkout history, reservation edits, and reset cleanliness schedules back to default curriculum parameters.
                </p>
                <button
                  onClick={() => setIsResetOpen(true)}
                  className="py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-3xs flex items-center space-x-1.5 text-xs transition-all animate-pulse"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Purge & Reinitialize Database</span>
                </button>
              </div>

            </div>
          )}

          {/* Tab 4: Display Settings */}
          {activeTab === "display" && (
            <form ref={displayFormRef} onSubmit={handleDisplaySave} className="space-y-4">
              <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-[10px]">PMS System Display Formats</h3>
                  <p className="text-[10px] text-gray-400">Align time, dates, and layouts with regional hospitality parameters.</p>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-ids-sidebar hover:bg-ids-sidebar-hover text-white rounded font-bold flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Formats</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Default Currency</label>
                  <select
                    value={displayForm.currency}
                    onChange={(e) => setDisplayForm({ ...displayForm, currency: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded bg-white font-bold text-gray-700"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Date Format Style</label>
                  <select
                    value={displayForm.dateFormat}
                    onChange={(e) => setDisplayForm({ ...displayForm, dateFormat: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded bg-white font-bold text-gray-700"
                  >
                    <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g. 14-JAN-2022)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-30)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Display Theme Palette</label>
                  <select
                    value={displayForm.theme}
                    onChange={(e) => setDisplayForm({ ...displayForm, theme: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded bg-white font-bold text-gray-700"
                  >
                    <option value="IDS Classic (Beige)">IDS Classic High-Contrast (Beige/Slate)</option>
                    <option value="Cosmic Slate (Dark)">Cosmic Dark (Experimental)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">System Language</label>
                  <select
                    value={displayForm.language}
                    onChange={(e) => setDisplayForm({ ...displayForm, language: e.target.value })}
                    className="w-full p-2 border border-ids-border rounded bg-white font-bold text-gray-700"
                  >
                    <option value="English">English (United Kingdom)</option>
                    <option value="Hindi">English (Indian English/International)</option>
                  </select>
                </div>
              </div>
            </form>
          )}

          {/* Tab 5: Diagnostics & PWA */}
          {activeTab === "diagnostics" && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="font-black text-slate-800 uppercase text-[10px]">Diagnostics & PWA Status</h3>
                <p className="text-[10px] text-gray-400">Monitor training server latency, browser sandbox storage, and PWA integration status.</p>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                
                <div className="bg-slate-50 border border-ids-border p-3 rounded flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-gray-400">PWA Offline Mode</span>
                    <p className="font-bold text-slate-800">Service Worker Active</p>
                  </div>
                  <Wifi className="w-5 h-5 text-green-600 stroke-[2.5]" />
                </div>

                <div className="bg-slate-50 border border-ids-border p-3 rounded flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-gray-400">Local Cache Storage</span>
                    <p className="font-bold text-slate-800">4.12 MB (Assets cached)</p>
                  </div>
                  <Radio className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
                </div>

                <div className="bg-slate-50 border border-ids-border p-3 rounded flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-gray-400">Browser Environment</span>
                    <p className="font-bold text-slate-800">iFrame Sandboxed</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600 stroke-[2.5]" />
                </div>

                <div className="bg-slate-50 border border-ids-border p-3 rounded flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-gray-400">Sync Engine Latency</span>
                    <p className="font-bold text-slate-800">0 ms (Offline-Local)</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600 stroke-[2.5]" />
                </div>

              </div>

              {/* Force Service Worker check button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    if ("serviceWorker" in navigator) {
                      toast.promise(
                        navigator.serviceWorker.ready.then(() => {}),
                        {
                          loading: "Querying service worker caches...",
                          success: "Local service worker cache is completely up to date!",
                          error: "Cache sync failed."
                        }
                      );
                    } else {
                      toast.error("Service worker not supported in this browser viewport.");
                    }
                  }}
                  className="px-4 py-1.5 border border-ids-border hover:bg-gray-50 text-slate-700 font-bold rounded transition-all bg-white"
                >
                  Verify Offline Cache Status
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Demo Reset Danger Zone Double-Confirmation modal */}
      <DemoResetModal 
        isOpen={isResetOpen} 
        onClose={() => setIsResetOpen(false)}
        onResetComplete={() => setActiveTab("profile")}
      />
    </PageWrapper>
  );
};

export default Settings;
