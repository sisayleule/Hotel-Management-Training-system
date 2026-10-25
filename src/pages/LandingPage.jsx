import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bed, 
  Users, 
  Calendar, 
  BarChart3, 
  ArrowRight, 
  GraduationCap,
  BookOpen,
  Award,
  Target,
  ChevronRight,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

export const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-[#0a1b3d]/90 backdrop-blur-lg shadow-lg" 
            : "bg-[#0a1b3d]/70 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              {/* Ambo University Logo */}
              <img 
                src="/images/ambo-university-logo.png" 
                alt="Ambo University" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-lg font-black text-white tracking-tight">
                  InnSync
                </h1>
                <p className="text-xs text-gray-300 font-semibold">
                  Hotel Management Training System
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a 
                href="#about" 
                className="text-sm font-semibold text-white hover:text-[#C5A572] transition-colors"
              >
                About
              </a>
              <a 
                href="#how-it-works" 
                className="text-sm font-semibold text-white hover:text-[#C5A572] transition-colors"
              >
                How It Works
              </a>
              <a 
                href="#contact" 
                className="text-sm font-semibold text-white hover:text-[#C5A572] transition-colors"
              >
                Contact
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2.5 text-sm font-bold text-white hover:text-[#C5A572] transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-5 py-2.5 bg-gradient-to-r from-[#C5A572] to-[#d4af37] text-[#0a1128] text-sm font-bold rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Start Training
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          {/* Your custom hotel lobby image */}
          <img
            src="/images/hotel-lobby.jpg"
            alt="Luxury Hotel Lobby"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback gradient if image not found
              e.target.style.display = 'none';
              e.target.parentElement.style.background = 'linear-gradient(135deg, #1a254d 0%, #0a1128 100%)';
            }}
          />
          {/* Deep Navy Gradient Overlay - Left 55% */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1b3d]/98 via-[#0a1b3d]/85 via-40% to-transparent to-55%"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full pt-20">
          <div className="max-w-2xl space-y-6">
            {/* University Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <img 
                src="/images/ambo-university-logo.png" 
                alt="Ambo University" 
                className="w-5 h-5 object-contain"
              />
              <span className="text-xs font-semibold text-white">
                Ambo University - Woliso Campus
              </span>
            </div>

            {/* Main Heading - Smaller & Cleaner */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                InnSync Hotel Management
                <br />
                Training System
              </h1>
              {/* Gold Accent Line */}
              <div className="w-20 h-1 bg-gradient-to-r from-[#C5A572] to-[#d4af37]"></div>
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-200 font-light leading-relaxed">
              Master Real-World Hotel Operations.
              <br />
              Launch Your Hospitality Career.
            </p>

            {/* Department Info */}
            <p className="text-sm text-gray-300 font-medium">
              Department of Tourism and Hotel Management
            </p>

            {/* CTA Buttons - Better Sized */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => navigate("/register")}
                className="group px-6 py-3 bg-gradient-to-r from-[#C5A572] to-[#d4af37] text-[#0a1128] text-sm font-bold rounded-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Start Training</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white text-sm font-bold rounded-lg border border-white/30 hover:bg-white/20 hover:border-[#C5A572] transition-all duration-300"
              >
                Login
              </button>
            </div>

            {/* Feature Icons - Compact */}
            <div className="grid grid-cols-4 gap-4 pt-6">
              {[
                { icon: Bed, label: "Reservations" },
                { icon: Users, label: "Guests" },
                { icon: Calendar, label: "Bookings" },
                { icon: BarChart3, label: "Reports" }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-pointer"
                >
                  <feature.icon className="w-6 h-6 text-[#C5A572]" strokeWidth={2} />
                  <span className="text-xs font-semibold text-white text-center">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-[#2E3B8E]">
              About Our Training Program
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#C5A572] to-[#d4af37] mx-auto"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-6">
              Comprehensive hands-on training in modern hotel property management systems
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Comprehensive Curriculum",
                description: "Master all aspects of hotel management from front desk operations to advanced reporting and analytics"
              },
              {
                icon: Target,
                title: "Real-World Scenarios",
                description: "Practice with realistic hotel scenarios including reservations, check-ins, housekeeping, and guest services"
              },
              {
                icon: Award,
                title: "Industry-Standard Skills",
                description: "Learn the same systems used in professional hotels worldwide, preparing you for immediate employment"
              },
              {
                icon: Users,
                title: "Guest Management",
                description: "Build guest profiles, track preferences, manage loyalty programs, and deliver exceptional service"
              },
              {
                icon: Calendar,
                title: "Reservation Systems",
                description: "Handle complex bookings, group reservations, rate management, and availability optimization"
              },
              {
                icon: BarChart3,
                title: "Analytics & Reporting",
                description: "Generate occupancy reports, revenue analysis, and operational insights for data-driven decisions"
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-[#C5A572] hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                {/* 3D Card Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2E3B8E]/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500"></div>
                
                <div className="relative z-10 space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2E3B8E] to-[#1e2870] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-[#2E3B8E]">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#C5A572]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-[#2E3B8E] to-[#1e2870] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white">
              How the Training Works
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#C5A572] to-[#d4af37] mx-auto"></div>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto mt-6">
              A structured approach to mastering hotel property management
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Register & Setup",
                description: "Create your account and get access to the comprehensive training platform",
                icon: GraduationCap
              },
              {
                step: "02",
                title: "Learn Modules",
                description: "Work through structured modules covering all aspects of hotel management",
                icon: BookOpen
              },
              {
                step: "03",
                title: "Practice Operations",
                description: "Hands-on practice with realistic scenarios in a safe training environment",
                icon: Target
              },
              {
                step: "04",
                title: "Master & Certify",
                description: "Complete assessments and earn your certification in hotel management",
                icon: Award
              }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {/* Connection Line */}
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#C5A572] to-transparent -translate-x-1/2 z-0"></div>
                )}

                {/* Step Card */}
                <div className="relative z-10 group">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 hover:border-[#C5A572] transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl">
                    {/* Step Number */}
                    <div className="text-6xl font-black text-[#C5A572]/30 mb-4">
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-[#C5A572] to-[#d4af37] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="w-8 h-8 text-[#2E3B8E]" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-black text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-200 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <button
              onClick={() => navigate("/register")}
              className="group inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#C5A572] to-[#d4af37] text-[#2E3B8E] text-lg font-black rounded-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <span>Begin Your Journey</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#0a1128] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                {/* Ambo University Logo */}
                <img 
                  src="/images/ambo-university-logo.png" 
                  alt="Ambo University" 
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <h3 className="text-xl font-black text-[#C5A572]">InnSync</h3>
                  <p className="text-xs text-gray-400">Training System</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Empowering the next generation of hospitality professionals through innovative technology and hands-on training.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {["About", "Programs", "Contact", "Support"].map((link) => (
                  <li key={link}>
                    <a 
                      href={`#${link.toLowerCase()}`}
                      className="text-sm text-gray-400 hover:text-[#C5A572] transition-colors flex items-center space-x-2 group"
                    >
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      <span>{link}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Programs */}
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                Programs
              </h4>
              <ul className="space-y-3">
                {[
                  "Front Desk Operations",
                  "Housekeeping Management",
                  "Food & Beverage",
                  "Hotel Analytics"
                ].map((program) => (
                  <li key={program}>
                    <a 
                      href="#programs"
                      className="text-sm text-gray-400 hover:text-[#C5A572] transition-colors"
                    >
                      {program}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                Contact
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3 text-sm text-gray-400">
                  <MapPin className="w-5 h-5 text-[#C5A572] shrink-0 mt-0.5" />
                  <span>Ambo University, Woliso Campus<br />Department of Tourism & Hotel Management</span>
                </li>
                <li className="flex items-center space-x-3 text-sm text-gray-400">
                  <Phone className="w-5 h-5 text-[#C5A572]" />
                  <span>+251 XXX XXX XXX</span>
                </li>
                <li className="flex items-center space-x-3 text-sm text-gray-400">
                  <Mail className="w-5 h-5 text-[#C5A572]" />
                  <span>tourism@ambou.edu.et</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-gray-400 text-center md:text-left">
                © 2026 Ambo University - Tourism & Hotel Management Department. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-sm text-gray-400 hover:text-[#C5A572] transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-gray-400 hover:text-[#C5A572] transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
