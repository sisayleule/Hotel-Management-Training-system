import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hotel, User, Mail, Lock, Building2, ArrowRight, Home, IdCard } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useEnterAsTab } from '../hooks/useEnterAsTab';
import toast from 'react-hot-toast';

export const Register = () => {
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // No need to fetch departments anymore

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!studentId.trim()) {
      toast.error('Please enter your Student ID');
      return;
    }
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Step 2: Create profile record with student_id
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          student_id: studentId,
          full_name: fullName,
          email: email,
          role: 'student',
          status: 'pending'
        });

      if (profileError) throw profileError;

      toast.success('Registration successful! Please wait for approval.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered');
      } else if (error.message.includes('duplicate key')) {
        toast.error('This Student ID is already registered');
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Apply Enter-as-Tab navigation
  const formRef = useEnterAsTab({ onSubmit: handleRegisterSubmit });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-ids-bg to-[#e9dec9] text-gray-800 p-4 safe-padding-bottom">
      {/* Centered registration card */}
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="bg-white border border-ids-border w-full max-w-md rounded shadow-xl overflow-hidden">
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
              Student Registration
            </p>
          </div>

          {/* Form Area */}
          <form ref={formRef} onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Student ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <IdCard className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Enter your Student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Register Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-ids-header hover:bg-ids-sidebar text-white text-sm font-bold tracking-wide rounded shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Register Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-ids-header hover:text-ids-sidebar font-semibold"
                >
                  Log in here
                </Link>
              </p>
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

export default Register;
