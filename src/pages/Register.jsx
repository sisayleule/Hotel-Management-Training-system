import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IdCard, User, Lock, ArrowRight, Home, AlertCircle, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useEnterAsTab } from '../hooks/useEnterAsTab';
import toast from 'react-hot-toast';

// UGR/12345/16 — UGR + slash + exactly 5 digits + slash + exactly 2 digits
const UGR_PATTERN = /^UGR\/[0-9]{5}\/[0-9]{2}$/;

/**
 * Converts a University ID to a synthetic internal email for Supabase Auth.
 * The email is NEVER shown to the student — it is only used as the Auth credential.
 * Example: UGR/12345/16 → ugr-12345-16@students.internal
 */
const toInternalEmail = (universityId) =>
  `${universityId.replace(/\//g, '-').toLowerCase()}@students.internal`;

export const Register = () => {
  const [universityId, setUniversityId] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [idError, setIdError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch departments on mount for the selector
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      if (error) {
        console.error('[Register] Failed to load departments:', error.message);
        toast.error('Could not load departments. Please refresh the page.');
      } else if (data) {
        setDepartments(data);
        // Auto-select if only one department exists
        if (data.length === 1) {
          setDepartmentId(data[0].id);
        }
      }
    };
    fetchDepartments();
  }, []);

  // Validate format on every keystroke so the user gets instant feedback
  const handleUniversityIdChange = (e) => {
    const val = e.target.value.toUpperCase();
    setUniversityId(val);
    if (val && !UGR_PATTERN.test(val)) {
      setIdError('Format must be UGR/12345/16 (UGR + 5 digits + 2 digits)');
    } else {
      setIdError('');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!universityId.trim()) {
      toast.error('Please enter your University ID');
      return;
    }
    if (!UGR_PATTERN.test(universityId)) {
      toast.error('University ID must be in format UGR/12345/16');
      return;
    }
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!departmentId) {
      toast.error('Please select your department');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Check if this University ID is already registered
      const { data: existing, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('university_id', universityId)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existing) {
        toast.error('This University ID is already registered. Please log in instead.');
        setLoading(false);
        return;
      }

      // Step 2: Generate synthetic internal email — never shown to student
      const internalEmail = toInternalEmail(universityId);

      // Step 3: Create Supabase Auth user with synthetic email + student's password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: internalEmail,
        password,
      });

      if (authError) {
        // Supabase says email already registered → University ID already in system
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          toast.error('This University ID is already registered. Please log in instead.');
        } else {
          throw authError;
        }
        setLoading(false);
        return;
      }

      // Step 4: Create the profile row with university_id as the student identifier
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          university_id: universityId,
          full_name: fullName,
          email: internalEmail, // internal only — never displayed to student
          role: 'student',
          status: 'pending',
          department_id: departmentId,  // required for dept head approval routing
        });

      if (profileError) {
        if (profileError.message.includes('duplicate') || profileError.code === '23505') {
          toast.error('This University ID is already registered. Please log in instead.');
        } else {
          throw profileError;
        }
        setLoading(false);
        return;
      }

      toast.success('Registration successful! Please wait for your department head to approve your account.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formRef = useEnterAsTab({ onSubmit: handleRegisterSubmit });

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
              Student Registration
            </p>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleRegisterSubmit} className="p-6 space-y-4">

            {/* University ID */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                University ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <IdCard className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="UGR/12345/16"
                  value={universityId}
                  onChange={handleUniversityIdChange}
                  className={`w-full pl-9 pr-3 py-2 border rounded focus:outline-none focus:ring-1 bg-gray-50 text-sm font-mono ${
                    idError
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                      : 'border-ids-border focus:ring-ids-header focus:border-ids-header'
                  }`}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {idError && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {idError}
                </p>
              )}
              <p className="mt-1 text-[10px] text-gray-400">
                Format: UGR/XXXXX/XX — e.g. UGR/12345/16
              </p>
            </div>

            {/* Full Name */}
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

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Building2 className="w-4 h-4" />
                </span>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-ids-border rounded focus:outline-none focus:ring-1 focus:ring-ids-header focus:border-ids-header bg-gray-50 text-sm"
                  disabled={loading}
                >
                  <option value="">Select your department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
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

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !!idError}
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

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-ids-header hover:text-ids-sidebar font-semibold">
                  Log in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <footer className="text-center py-4 border-t border-ids-border/30">
        <p className="text-xs font-semibold text-gray-500 tracking-wider">
          Powered by AMOB University Tourism &amp; Hotel Management Dept.
        </p>
      </footer>
    </div>
  );
};

export default Register;
