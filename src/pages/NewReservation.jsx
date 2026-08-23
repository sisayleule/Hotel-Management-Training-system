import React from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import { User, Building2, ArrowRight } from "lucide-react";

export const NewReservation = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper
      title="Create New Reservation"
      subtitle="Choose reservation type: Individual guest or Company/Corporate booking"
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Individual Reservation Card */}
          <button
            onClick={() => navigate("/app/reservations/new/individual")}
            className="group bg-white border-3 border-blue-300 rounded-xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-left"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <User className="w-12 h-12 text-blue-600" />
              </div>
              
              <h3 className="text-2xl font-black text-blue-900 uppercase tracking-wide">
                Individual Guest
              </h3>
              
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Create reservation for walk-in guests, personal bookings, or individual travelers. Standard rates apply.
              </p>
              
              <div className="pt-4 flex items-center space-x-2 text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
                <span>Start Individual Booking</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </button>

          {/* Company Reservation Card */}
          <button
            onClick={() => navigate("/app/reservations/new/company")}
            className="group bg-white border-3 border-orange-300 rounded-xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-left"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Building2 className="w-12 h-12 text-orange-600" />
              </div>
              
              <h3 className="text-2xl font-black text-orange-900 uppercase tracking-wide">
                Company / Corporate
              </h3>
              
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Create reservation linked to corporate account. Includes special corporate rates and company billing options.
              </p>
              
              <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2 mt-2">
                <p className="text-xs font-bold text-green-800">
                  ✓ 15% Corporate Discount
                </p>
              </div>
              
              <div className="pt-4 flex items-center space-x-2 text-orange-600 font-bold group-hover:translate-x-2 transition-transform">
                <span>Start Company Booking</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </button>

        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-700 font-medium">
            <span className="font-bold">Need help?</span> Choose "Individual Guest" for regular bookings. 
            Choose "Company / Corporate" for business travelers with corporate accounts.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default NewReservation;
