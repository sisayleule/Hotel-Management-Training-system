import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Password strength checker
const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[a-z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;
  return score; // 0-5
};

const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500'];

export const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useSupabaseAuth();

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [submitting,      setSubmitting]      = useState(false);

  const strength = getStrength(newPassword);

  const validate = () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return false;
    }
    if (strength < 3) {
      toast.error('Password is too weak. Add uppercase letters, numbers, or symbols.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 1. Update the Supabase auth password
      const { error: pwError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (pwError) throw pwError;

      // 2. Clear the must_change_password flag in profiles
      const { error: flagError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user.id);

      if (flagError) {
        // Non-fatal — password was changed; flag clear failure is recoverable
        console.error('Failed to clear must_change_password flag:', flagError.message);
      }

      toast.success('Password changed successfully! Welcome to InnSync.', {
        duration: 4000,
        icon: '🔐',
      });

      // Re-fetch profile so must_change_password is false in AuthContext state
      // before navigating — this prevents ProtectedRoute from bouncing us back.
      await refreshProfile();

      // Redirect based on role
      const role = profile?.role;
      if (role === 'dept_head') {
        navigate('/dept-head');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Password change failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-ids-bg to-[#e9dec9] text-gray-800 p-4 safe-padding-bottom">
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="bg-white border border-ids-border w-full max-w-md rounded shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-ids-sidebar text-white p-6 text-center border-b border-ids-border">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-wide uppercase">Set New Password</h1>
            <p className="text-sm text-ids-sidebar-text/80 mt-1">
              Your password was reset by your department head.
              <br />
              Please choose a new password to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Identity reminder */}
            <div className="bg-gray-50 border border-ids-border rounded px-3 py-2 text-xs text-gray-600 font-medium">
              Logged in as: <span className="font-bold text-ids-sidebar">
                {profile?.full_name || user?.email || 'Student'}
              </span>
            </div>

            {/* New password field */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-10 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header bg-gray-50 text-sm"
                  disabled={submitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= strength ? strengthColor[strength] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] font-bold ${
                    strength <= 2 ? 'text-red-600' : strength === 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {strengthLabel[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className={`w-full pl-9 pr-10 py-2 border rounded focus:outline-none focus:ring-1 bg-gray-50 text-sm ${
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-ids-border focus:ring-ids-header'
                  }`}
                  disabled={submitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="text-[10px] text-red-600 font-bold mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Password rules hint */}
            <ul className="text-[10px] text-gray-400 font-medium space-y-0.5 list-disc list-inside">
              <li>Minimum 8 characters</li>
              <li>Mix of uppercase, lowercase, numbers, and symbols recommended</li>
              <li>Do not reuse the temporary password you were given</li>
            </ul>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full py-2.5 px-4 bg-ids-header hover:bg-ids-sidebar text-white text-sm font-bold tracking-wide rounded shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span>Updating password…</span>
              ) : (
                <>
                  <span>Set New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center py-4 border-t border-ids-border/30">
        <p className="text-xs font-semibold text-gray-500 tracking-wider">
          InnSync V6.5 — Ambo University Tourism &amp; Hotel Management Dept.
        </p>
      </footer>
    </div>
  );
};

export default ChangePassword;
