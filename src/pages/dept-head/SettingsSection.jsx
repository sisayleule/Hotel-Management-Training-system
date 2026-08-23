import React, { useState, useEffect } from 'react';
import { Settings, User, Lock, Mail, Save, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const SettingsSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch current profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFullName(data.full_name || '');
      setEmailNotifications(data.email_notifications ?? true);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          email_notifications: emailNotifications,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        full_name: fullName.trim(),
        email_notifications: emailNotifications,
      }));

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setChangingPassword(true);
    try {
      // Step 1: Verify current password by attempting re-authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setChangingPassword(false);
        return;
      }

      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Success
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ids-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your personal account preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-ids-border">
        <div className="border-b border-ids-border p-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-ids-green" />
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ids-green focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email address cannot be changed. Contact admin if needed.
            </p>
          </div>

          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive alerts for new pending student registrations
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? 'bg-ids-green' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-ids-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg shadow-sm border border-ids-border">
        <div className="border-b border-ids-border p-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-ids-green" />
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          </div>
        </div>
        
        <div className="p-6">
          {!showPasswordForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Update your password to keep your account secure.
              </p>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 border border-ids-green text-ids-green rounded-lg hover:bg-ids-green hover:text-white transition-colors"
              >
                Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ids-green focus:border-transparent"
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ids-green focus:border-transparent"
                  placeholder="Enter new password (min 8 characters)"
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ids-green focus:border-transparent"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Password Requirements:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>At least 8 characters long</li>
                      <li>Must be different from current password</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex items-center gap-2 px-4 py-2 bg-ids-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {changingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={changingPassword}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Section */}
      <div className="bg-white rounded-lg shadow-sm border border-ids-border">
        <div className="border-b border-ids-border p-4">
          <div className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-ids-green" />
            <h3 className="text-lg font-semibold text-gray-900">Sign Out</h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Sign out of your account and return to the login page.
          </p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loggingOut ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
