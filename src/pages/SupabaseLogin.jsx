import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, Home, IdCard } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../contexts/AuthContext';
import { useEnterAsTab } from '../hooks/useEnterAsTab';
import toast from 'react-hot-toast';

export const SupabaseLogin = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { authStatusRejection, profile } = useSupabaseAuth();
  const statusAlertShownRef = React.useRef(false);

  // Show status message from ProtectedRoute if redirected due to mid-session status change
  useEffect(() => {
    if (statusAlertShownRef.current) return;

    if (location.state?.statusReason) {
      const status = location.state.statusReason;
      const bannedReason = location.state.bannedReason;
      const rejectedReason = location.state.rejectedReason;

      showStatusAlert(status, bannedReason, rejectedReason);
      statusAlertShownRef.current = true;

      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Watch for authStatusRejection from AuthContext (centralized gate)
  useEffect(() => {
    if (authStatusRejection && !statusAlertShownRef.current && loginAttempted) {
      console.log('[SupabaseLogin] Auth rejected:', authStatusRejection);
      showStatusAlert(
        authStatusRejection.status,
        authStatusRejection.banned_reason,
        authStatusRejection.rejected_reason
      );
      statusAlertShownRef.current = true;
      setLoading(false);
      setLoginAttempted(false);
    }
  }, [authStatusRejection, loginAttempted]);

  // Navigate to dashboard when profile becomes approved
  useEffect(() => {
    if (profile && profile.status === 'approved' && loginAttempted) {
      console.log('[SupabaseLogin] Profile approved, navigating to dashboard. Role:', profile.role);
      toast.success(`Welcome back, ${profile.full_name}!`);

      if (profile.role === 'admin') {
        navigate('/admin');
      } else if (profile.role === 'dept_head') {
        navigate('/dept-head');
      } else {
        navigate('/dashboard');
      }

      setLoading(false);
      setLoginAttempted(false);
    }
  }, [profile, loginAttempted, navigate]);

  const showStatusAlert = (status, bannedReason, rejectedReason) => {
    let errorTitle = '⛔ ACCESS DENIED';
    let errorMessage = 'Your account cannot access the system. Please contact your administrator.';

    if (status === 'pending') {
      errorTitle = '⚠️ ACCOUNT PENDING APPROVAL';
      errorMessage = 'Your registration is awaiting approval from your department head. You cannot access the system until your account is approved.\n\nPlease contact your department head for approval status.';
    } else if (status === 'rejected') {
      errorTitle = '🚫 ACCOUNT REJECTED';
      errorMessage = 'Your registration has been rejected. Please contact your department head for more information.';
      if (rejectedReason) {
        errorMessage += `\n\nReason: ${rejectedReason}`;
      }
    } else if (status === 'banned') {
      errorTitle = '🚫 ACCOUNT BANNED';
      errorMessage = 'Your account has been banned and you can no longer access the system.\n\nReason: ' + (bannedReason || 'No reason provided') + '\n\nPlease contact your department head if you believe this is an error.';
    } else if (status === 'deleted') {
      errorTitle = '🚫 ACCOUNT DELETED';
      errorMessage = 'This account has been deleted and can no longer be used. Please contact administration if you need assistance.';
    } else if (status === 'disabled') {
      errorTitle = '⛔ ACCOUNT DISABLED';
      errorMessage = 'Your account has been disabled by administration. Please contact your system administrator for assistance.\n\nAccess to the system has been revoked.';
    }

    toast.error(
      `${errorTitle}\n\n${errorMessage}`,
      {
        duration: 8000,
        style: {
          background: '#fef2f2',
          border: '3px solid #dc2626',
          color: '#991b1b',
          fontSize: '14px',
          fontWeight: '600',
          padding: '24px',
          maxWidth: '500px',
          minWidth: '400px',
          whiteSpace: 'pre-line',
        },
        icon: '🚫',
      }
    );
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!studentId.trim()) {
      toast.error('Please enter your Student ID');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    setLoginAttempted(true);
    statusAlertShownRef.current = false;

    try {
      const idInput = studentId.trim();

      // Resolve the Supabase Auth email from the profiles table.
      // Try all three strategies so old and new accounts all work:
      //   1. Match by student_id column (new registrations)
      //   2. Match by university_id column (migration path)
      //   3. Treat the input as a direct email (pre-existing accounts)

      let resolvedEmail = null;

      // Strategy 1 & 2: look up by student_id OR university_id in one query
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .or(`student_id.eq.${idInput},university_id.eq.${idInput}`)
        .maybeSingle();

      if (profileData?.email) {
        resolvedEmail = profileData.email;
      } else {
        // Strategy 3: treat input as a direct email (covers old accounts)
        resolvedEmail = idInput;
      }

      // Sign in with whatever email we resolved
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError) throw authError;

      // AuthContext takes over: fetches profile, checks status, navigates or rejects
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Student ID or password is incorrect. Please try again.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
      setLoading(false);
      setLoginAttempted(false);
    }
  };

  const formRef = useEnterAsTab({ onSubmit: handleLoginSubmit });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-ids-bg to-[#e9dec9] text-gray-800 p-4 safe-padding-bottom">
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="bg-white border border-ids-border w-full max-w-md rounded shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-ids-sidebar text-ids-sidebar-text p-6 text-center border-b border-ids-border relative">
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
              Student & Staff Login
            </p>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Student ID or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <IdCard className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. UGR/12345/16 or your email"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
                  disabled={loading}
                  autoComplete="username"
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-ids-header hover:bg-ids-sidebar text-white text-sm font-bold tracking-wide rounded shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-ids-header hover:text-ids-sidebar font-semibold"
                >
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <footer className="text-center py-4 border-t border-ids-border/30">
        <p className="text-xs font-semibold text-gray-500 tracking-wider">
          Powered by AMOB University Tourism & Hotel Management Dept.
        </p>
      </footer>
    </div>
  );
};

export default SupabaseLogin;
