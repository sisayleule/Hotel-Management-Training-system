import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useHotelStore } from '../store/useHotelStore';
import { useRoleStore } from '../store/useRoleStore';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [authStatusRejection, setAuthStatusRejection] = useState(null);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfileAndCheckStatus(session.user.id, 'INITIAL_SESSION');
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth event:', event);
      
      if (event === 'SIGNED_OUT') {
        // User explicitly signed out - clear everything
        setUser(null);
        setProfile(null);
        setProfileError(null);
        setAuthStatusRejection(null);
        useHotelStore.setState({ currentUser: null });
        setLoading(false);
      } else if (event === 'SIGNED_IN') {
        // Fresh sign-in - fetch profile and check status (CENTRALIZED GATE)
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfileAndCheckStatus(session.user.id, 'SIGNED_IN');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed - silently refetch profile in background
        // DO NOT touch loading state or redirect on failure
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id, 'TOKEN_REFRESHED');
        }
      } else if (event === 'USER_UPDATED') {
        // User data updated - refetch profile
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id, 'USER_UPDATED');
        }
      } else {
        // Other events
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfileAndCheckStatus(session.user.id, event);
        } else {
          setProfile(null);
          setProfileError(null);
          setAuthStatusRejection(null);
          useHotelStore.setState({ currentUser: null });
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // CENTRALIZED STATUS GATE - This is the ONLY place that rejects non-approved accounts
  const fetchProfileAndCheckStatus = async (userId, eventType = 'UNKNOWN', retryCount = 0) => {
    const maxRetries = 1;
    const retryDelay = 1000; // 1 second
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Check if it's a "not found" error (PGRST116)
        if (error.code === 'PGRST116') {
          // Profile genuinely doesn't exist - this is a real error
          console.error('[AuthContext] Profile not found for user:', userId);
          setProfile(null);
          setProfileError('Profile not found');
          setAuthStatusRejection({ status: 'not_found', reason: 'Profile not found' });
          useHotelStore.setState({ currentUser: null });
          
          // Sign out - profile doesn't exist
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Network/timeout/temporary error - retry once
        if (retryCount < maxRetries) {
          console.warn(`[AuthContext] Profile fetch failed (${eventType}), retrying...`, error);
          setTimeout(() => {
            fetchProfileAndCheckStatus(userId, eventType, retryCount + 1);
          }, retryDelay);
          return;
        }
        
        // Max retries exceeded - but DON'T clear profile if we have one
        console.error('[AuthContext] Profile fetch failed after retries:', error);
        setProfileError(error.message);
        
        // For SIGNED_IN/INITIAL_SESSION, we need to set loading false
        if (eventType === 'SIGNED_IN' || eventType === 'INITIAL_SESSION') {
          setLoading(false);
        }
        return;
      }

      // SUCCESS - Profile fetched, now CHECK STATUS (CENTRALIZED GATE)
      if (data.status !== 'approved') {
        // REJECT: Status is not approved
        console.log(`[AuthContext] REJECTING session: status=${data.status}`);
        
        // Set rejection info for SupabaseLogin to display
        setAuthStatusRejection({
          status: data.status,
          banned_reason: data.banned_reason,
          rejected_reason: data.rejected_reason
        });
        
        // Clear profile and user
        setProfile(null);
        setUser(null);
        useHotelStore.setState({ currentUser: null });
        
        // Sign out IMMEDIATELY - this is the ONLY place that does this for status reasons
        await supabase.auth.signOut();
        
        setLoading(false);
        return;
      }

      // APPROVED - Set profile and user
      console.log(`[AuthContext] APPROVED session: status=${data.status}`);
      setProfile(data);
      setProfileError(null);
      setAuthStatusRejection(null); // Clear any previous rejection
      
      // Show welcome message:
      // - "Welcome back" for returning sessions restored automatically (INITIAL_SESSION)
      // - Fresh SIGNED_IN handled by SupabaseLogin.jsx to avoid double-toast
      if (eventType === 'INITIAL_SESSION') {
        const displayName = data.full_name || data.university_id || 'User';
        toast.success(`Welcome back, ${displayName}!`, {
          duration: 4000,
          icon: '👋',
        });
      }
      
      // Determine training RBAC role based on auth role
      // Map auth roles to training roles for the PMS system
      let trainingRole = 'hotel_manager'; // Default fallback
      
      // If user has an explicit training role in their profile, use that
      if (data.training_role) {
        trainingRole = data.training_role;
      } else {
        // Otherwise, map auth roles to sensible training defaults
        switch (data.role) {
          case 'admin':
          case 'dept_head':
            trainingRole = 'hotel_manager'; // Admin/dept_head get full access
            break;
          case 'student':
            // Students: respect the role switcher selection stored in localStorage,
            // only default to front_office if no role has been selected yet
            trainingRole = localStorage.getItem('pms_demo_role') || 'front_office';
            break;
          default:
            trainingRole = 'hotel_manager';
        }
      }
      
      // Sync training RBAC role store
      console.log(`[AuthContext] Setting training role: ${trainingRole} for auth role: ${data.role}`);
      useRoleStore.getState().setRole(trainingRole);
      
      // Update Zustand store with Supabase user data
      if (data) {
        useHotelStore.setState({
          currentUser: {
            id: data.id,
            email: user?.email || '',
            full_name: data.full_name,
            authRole: data.role,
            department_id: data.department_id,
            status: data.status,
            // For students, show university_id as username; for staff use email local part
            username: data.university_id || user?.email?.split('@')[0] || '',
            role: trainingRole
          }
        });
      }
      
      setLoading(false);
    } catch (error) {
      // Unexpected error (not from Supabase query)
      console.error('[AuthContext] Unexpected error in fetchProfileAndCheckStatus:', error);
      setProfileError(error.message);
      
      // Retry once for unexpected errors too
      if (retryCount < maxRetries) {
        setTimeout(() => {
          fetchProfileAndCheckStatus(userId, eventType, retryCount + 1);
        }, retryDelay);
        return;
      }
      
      if (eventType === 'SIGNED_IN' || eventType === 'INITIAL_SESSION') {
        setLoading(false);
      }
    }
  };

  // Legacy fetchProfile for TOKEN_REFRESHED and USER_UPDATED (no status gate)
  const fetchProfile = async (userId, eventType = 'UNKNOWN', retryCount = 0) => {
    const maxRetries = 1;
    const retryDelay = 1000;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.error('[AuthContext] Profile not found for user:', userId);
          setProfile(null);
          setProfileError('Profile not found');
          useHotelStore.setState({ currentUser: null });
          return;
        }
        
        if (retryCount < maxRetries) {
          console.warn(`[AuthContext] Profile fetch failed (${eventType}), retrying...`, error);
          setTimeout(() => {
            fetchProfile(userId, eventType, retryCount + 1);
          }, retryDelay);
          return;
        }
        
        console.error('[AuthContext] Profile fetch failed after retries:', error);
        setProfileError(error.message);
        return;
      }

      // Update profile (no status gate for background refreshes)
      setProfile(data);
      setProfileError(null);
      
      // Determine training RBAC role
      let trainingRole = 'hotel_manager';
      if (data.training_role) {
        trainingRole = data.training_role;
      } else {
        switch (data.role) {
          case 'admin':
          case 'dept_head':
            trainingRole = 'hotel_manager';
            break;
          case 'student':
            trainingRole = 'front_office';
            break;
          default:
            trainingRole = 'hotel_manager';
        }
      }
      
      // Sync role store
      useRoleStore.getState().setRole(trainingRole);
      
      if (data) {
        useHotelStore.setState({
          currentUser: {
            id: data.id,
            email: user?.email || '',
            full_name: data.full_name,
            authRole: data.role,
            department_id: data.department_id,
            status: data.status,
            username: user?.email?.split('@')[0] || '',
            role: trainingRole
          }
        });
      }
    } catch (error) {
      console.error('[AuthContext] Unexpected error in fetchProfile:', error);
      setProfileError(error.message);
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          fetchProfile(userId, eventType, retryCount + 1);
        }, retryDelay);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setProfileError(null);
    setAuthStatusRejection(null);
    useHotelStore.setState({ currentUser: null });
  };

  const value = {
    user,
    profile,
    loading, // This stays true until status check is complete
    profileError,
    authStatusRejection, // NEW: Rejection info for SupabaseLogin to display
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
