import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Hotel, Sparkles, User, Lock, ArrowRight, Home } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useEnterAsTab } from "../hooks/useEnterAsTab.js";
import toast from "react-hot-toast";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username.");
      return;
    }
    // Simple authentication
    if (password === "demo123" || password === "") {
      login(username, role);
      toast.success(`Welcome, ${username.toUpperCase()}! Logged in as ${role}`);
      navigate("/");
    } else {
      toast.error("Incorrect password! Use 'demo123' or click Enter Demo Mode.");
    }
  };

  const handleEnterDemo = () => {
    const demoUser = role === "manager" ? "IT ADMIN" : role === "housekeeping" ? "HK ASSISTANT" : "FD ASSOCIATE";
    login(demoUser, role);
    toast.success(`Logged into Demo Mode as ${role.toUpperCase()}`);
    navigate("/");
  };

  // Apply Enter-as-Tab navigation
  const formRef = useEnterAsTab({ onSubmit: handleLoginSubmit });

  return (
    <div id="login-page" className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-ids-bg to-[#e9dec9] text-gray-800 p-4 safe-padding-bottom">
      {/* Centered login card wrapper */}
      <div className="flex-1 flex items-center justify-center py-10">
        <div id="login-card" className="bg-white border border-ids-border w-full max-w-md rounded shadow-xl overflow-hidden">
          {/* Logo Brand Header */}
          <div className="bg-ids-sidebar text-ids-sidebar-text p-6 text-center border-b border-ids-border relative">
            {/* Back to Home Button */}
            <button
              onClick={() => navigate('/')}
              className="absolute left-4 top-4 p-2 hover:bg-white/10 rounded-full transition-colors group"
              title="Back to Home"
            >
              <Home className="w-5 h-5 text-white/70 group-hover:text-white" />
            </button>
            
            <div className="flex justify-center mb-3">
              <img 
                src="/images/ambo-university-logo.png" 
                alt="Ambo University" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold font-sans text-white tracking-widest uppercase">INNSYNC</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-room-vacant mt-0.5">V6.5 Training Edition</p>
            <p className="text-[11px] font-semibold text-ids-sidebar-text/80 font-sans mt-2">
              AMOB University — Hotel Management Training System
            </p>
          </div>

          {/* Form Area */}
          <form ref={formRef} id="login-form" onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="input-username"
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="input-password"
                  type="password"
                  placeholder="demo123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Hint: any name works; password is 'demo123' or empty.</p>
            </div>

            {/* Role Chip Selectors */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Training Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "frontdesk", label: "Front Desk" },
                  { id: "housekeeping", label: "Housekeeping" },
                  { id: "manager", label: "Manager" }
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`role-chip-${item.id}`}
                    type="button"
                    onClick={() => {
                      setRole(item.id);
                      if (!username) {
                        setUsername(item.id === "manager" ? "IT ADMIN" : item.id === "housekeeping" ? "HK ASSISTANT" : "FD ASSOCIATE");
                      }
                    }}
                    className={`py-1.5 px-2 rounded border text-center text-xs font-bold transition-all ${
                      role === item.id
                        ? "bg-ids-header border-ids-header text-white"
                        : "bg-gray-50 border-ids-border text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-2">
              <button
                id="btn-login-submit"
                type="submit"
                className="w-full py-2 px-4 bg-ids-header hover:bg-ids-sidebar text-white text-sm font-bold tracking-wide rounded shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2"
              >
                <span>Authorize & Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-login-demo"
                type="button"
                onClick={handleEnterDemo}
                className="w-full py-2 px-4 bg-ids-bg hover:bg-ids-border/30 text-ids-sidebar border border-ids-border text-sm font-bold tracking-wide rounded shadow-xs transition-all"
              >
                Enter Demo Mode
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center py-4 border-t border-ids-border/30">
        <p className="text-xs font-semibold text-gray-500 tracking-wider">
          Powered by AMOB University Tourism & Hotel Management Dept.
        </p>
      </footer>
    </div>
  );
};

export default Login;
