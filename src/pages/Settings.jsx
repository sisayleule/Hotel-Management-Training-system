import React, { useState } from "react";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { useHotelStore } from "../store/useHotelStore.js";
import RoleSwitcher from "../components/settings/RoleSwitcher.jsx";
import { Building, Key, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";

export const Settings = () => {
  const { hotelProfile, updateHotelProfile } = useHotelStore();

  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({ ...hotelProfile });

  const profileFormRef = useEnterAsTab({ onSubmit: handleProfileSave });

  function handleProfileSave(e) {
    e.preventDefault();
    updateHotelProfile(profileForm);
    toast.success("Hotel property profile updated successfully!");
  }

  const tabs = [
    { id: "profile", label: "Hotel Profile", icon: Building },
    { id: "roles",   label: "Demo Role Switcher", icon: Key },
  ];

  return (
    <PageWrapper
      title="PMS System Configurations"
      subtitle="Configure hotel profile or switch interactive training roles"
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

          {/* Hotel Profile */}
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

          {/* Demo Role Switcher */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <RoleSwitcher />
            </div>
          )}

        </div>
      </div>
    </PageWrapper>
  );
};

export default Settings;
