# Design Document: Authentication & Access Control

## Document Information

**Design Document Version**: 1.0  
**Date**: 2026-08-12  
**Status**: Draft - Awaiting Reviewer Approval  
**Requirements Document**: requirements.md (Approved)  
**Next Phase**: tasks.md (after design approval)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Design](#database-design)
3. [Component Architecture](#component-architecture)
4. [Authentication Flow](#authentication-flow)
5. [Authorization & RLS](#authorization--rls)
6. [Phase-by-Phase Design](#phase-by-phase-design)
7. [Integration Strategy](#integration-strategy)
8. [Design Decisions](#design-decisions)
9. [Security Considerations](#security-considerations)

---

## 1. Architecture Overview

### 1.1 System Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│  React Components (Login, Register, Admin/DeptHead/Training App)   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
│  AuthContext/Hook, ProtectedRoute, RoleGuards, Supabase Client      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE LAYER                               │
│  Auth Service (signUp, signIn, signOut, session management)         │
│  Database Service (profiles, departments with RLS)                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Role Hierarchy

**Two-Layer Role System** (CRITICAL: Keep these separate):

**Layer 1: Auth Hierarchy Roles** (NEW - Supabase `profiles.role`)
- **admin**: Full system access, creates Dept Heads, manages all users
- **dept_head**: Manages students in their department, approves registrations
- **student**: Training app user, requires approval to access

**Layer 2: Training Operational Roles** (EXISTING - `useRoleStore.currentRole`)
- **hotel_manager**: Hotel management training role
- **front_office**: Front desk operations training role
- **housekeeping**: Housekeeping operations training role
- **waiter_fnb**: Food & beverage operations training role

**Flow**:
1. User authenticates → Gets Layer 1 role (admin/dept_head/student) from Supabase
2. IF student (approved) → Lands in training app → Layer 2 role switcher available
3. IF admin/dept_head → Lands in separate dashboard → NO Layer 2 role switcher

### 1.3 Technology Stack

**Frontend**:
- React 18 (existing)
- React Router v6 (existing)
- Zustand (existing state management)
- Tailwind CSS (existing)
- react-hot-toast (existing)

**Backend**:
- Supabase Auth (authentication service)
- Supabase Database (PostgreSQL with RLS)
- Supabase Client SDK (@supabase/supabase-js)

**New Dependencies**:
- `@supabase/supabase-js`: ^2.x (Supabase client library)

---

## 2. Database Design

### 2.1 Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       auth.users (Supabase)                     │
│  • id (UUID, PK)                                                │
│  • email                                                        │
│  • encrypted_password                                           │
│  • created_at                                                   │
│  • raw_user_meta_data (JSONB)                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ (1:1)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      profiles (Custom)                          │
│  • id (UUID, PK, FK → auth.users.id)                           │
│  • full_name (TEXT)                                             │
│  • role (ENUM: admin | dept_head | student)                     │
│  • department_id (UUID, FK → departments.id, NULLABLE)          │
│  • status (ENUM: pending | approved | disabled)                 │
│  • created_at, updated_at (TIMESTAMP)                           │
│                                                                 │
│  CONSTRAINTS:                                                   │
│  • dept_head MUST have department_id                            │
│  • admin MUST NOT have department_id                            │
│  • student MAY have department_id (assigned at registration)    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ (N:1)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    departments (Custom)                         │
│  • id (UUID, PK)                                                │
│  • name (TEXT, UNIQUE)                                          │
│  • dept_head_id (UUID, FK → profiles.id, NULLABLE)              │
│  • created_at, updated_at (TIMESTAMP)                           │
│                                                                 │
│  SEED DATA (Phase A):                                           │
│  • "General" department (for Phase B testing)                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 RLS Helper Functions

**Purpose**: Prevent infinite recursion in RLS policies

```sql
-- Get current user's auth role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's department (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_department()
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 2.3 RLS Policy Matrix

| Table | User Role | SELECT | INSERT | UPDATE | DELETE |
|-------|-----------|--------|--------|--------|--------|
| **profiles** | Student | Own row only | ❌ | Own row (name only, role/status/dept locked) | ❌ |
| **profiles** | Dept Head | Own row + students in dept | ❌ | Students in dept (status only) | ❌ |
| **profiles** | Admin | All rows | ✅ | All rows | ✅ |
| **departments** | Student | All (read-only for dropdown) | ❌ | ❌ | ❌ |
| **departments** | Dept Head | All (read-only) | ❌ | ❌ | ❌ |
| **departments** | Admin | All | ✅ | ✅ | ✅ |

### 2.4 Indexes

```sql
-- Performance optimization for common queries
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
```

**Rationale**:
- `department_id`: Dept Heads filter students by department frequently
- `role`: Admin dashboard filters by role (admins/dept_heads/students)
- `status`: Dept Heads filter by status (pending/approved)

---

## 3. Component Architecture

### 3.1 New Components (Phases A-E)

```
src/
├── lib/
│   └── supabaseClient.js          # Supabase client singleton (Phase A)
│
├── contexts/
│   └── AuthContext.jsx             # Auth state provider (Phase B)
│
├── hooks/
│   └── useSupabaseAuth.js          # Auth hook (Phase B)
│
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx     # UPDATE existing (Phase B)
│   │   ├── RoleGuard.jsx          # NEW: Auth role guard (Phase C)
│   │   └── PublicRoute.jsx        # NEW: Redirect if authenticated (Phase B)
│   │
│   ├── admin/
│   │   ├── AdminDashboard.jsx     # Admin main page (Phase C)
│   │   ├── CreateDeptHeadModal.jsx
│   │   ├── CreateDepartmentModal.jsx
│   │   ├── UserList.jsx
│   │   └── DepartmentCard.jsx
│   │
│   └── dept-head/
│       ├── DeptHeadDashboard.jsx  # Dept Head main page (Phase D)
│       ├── PendingStudentCard.jsx
│       ├── ApprovedStudentCard.jsx
│       └── StudentApprovalModal.jsx
│
├── pages/
│   ├── Login.jsx                   # Login page (Phase B)
│   ├── Register.jsx                # Registration page (Phase B)
│   ├── AdminDashboard.jsx          # Admin dashboard route (Phase C)
│   └── DeptHeadDashboard.jsx       # Dept Head dashboard route (Phase D)
│
└── supabase/
    └── functions/
        └── create-dept-head/
            ├── index.ts            # Edge Function (Phase A.5)
            └── .env                # Service role key (gitignored)
```

### 3.2 Modified Components (Phase E Integration)

```
src/
├── store/
│   └── useHotelStore.js            # UPDATE: currentUser from Supabase
│
├── components/
│   └── layout/
│       ├── TopHeader.jsx           # UPDATE: Display Supabase user name
│       └── Sidebar.jsx             # NO CHANGE (role switcher unchanged)
│
├── hooks/
│   └── useAuth.js                  # UPDATE: Use Supabase session
│
└── App.tsx                         # UPDATE: Add /login, /register, /admin, /dept-head routes
```

### 3.3 Component Interaction Flow

**Registration Flow**:
```
Register.jsx
    │
    ├─> Supabase Auth signUp()
    │       └─> auth.users created
    │
    └─> Supabase DB insert profiles
            └─> profiles row created (status=pending)
            └─> Redirect to /login
```

**Login Flow**:
```
Login.jsx
    │
    ├─> Supabase Auth signInWithPassword()
    │       └─> Session created
    │
    ├─> Fetch profile from profiles table
    │       └─> Check status (pending/disabled → reject)
    │
    └─> Route by role:
            ├─> admin → /admin
            ├─> dept_head → /dept-head
            └─> student (approved) → /dashboard
```

**Approval Flow**:
```
DeptHeadDashboard.jsx
    │
    ├─> Fetch students WHERE department_id = my_department AND status = 'pending'
    │
    └─> User clicks "Approve"
            │
            └─> UPDATE profiles SET status = 'approved' WHERE id = student_id
                    └─> RLS enforces dept_head can only update students in their dept
```

---

## 4. Authentication Flow

### 4.1 Supabase Auth Integration

**Client Configuration** (`src/lib/supabaseClient.js`):
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4.2 Auth Context Provider

**Purpose**: Centralize auth state, provide session management across app

```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useHotelStore } from '../store/useHotelStore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const setCurrentUser = useHotelStore(state => state.setCurrentUser);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProfile(data);
      
      // Update Zustand store with Supabase profile data
      setCurrentUser({
        id: data.id,
        email: user.email,
        full_name: data.full_name,
        authRole: data.role, // NEW: Auth hierarchy role
        department_id: data.department_id,
        status: data.status
        // NOTE: Training operational role stored separately in useRoleStore
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSupabaseAuth = () => useContext(AuthContext);
```

### 4.3 Protected Route Component

**Update Existing** (`src/components/auth/ProtectedRoute.jsx`):

```javascript
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

export const ProtectedRoute = ({ children, requireRole = null }) => {
  const { user, profile, loading } = useSupabaseAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's status is approved
  if (profile?.status !== 'approved') {
    // User is pending or disabled - redirect to login with error
    return <Navigate to="/login" state={{ error: 'pending' }} replace />;
  }

  // Optional role check (e.g., requireRole="admin")
  if (requireRole && profile?.role !== requireRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

### 4.4 Session Persistence

**Supabase handles session persistence automatically via cookies/localStorage**:
- Default session duration: 1 hour
- Refresh token automatically renews session
- No manual persistence logic needed

**Session expiry handling**:
```javascript
// In AuthContext, onAuthStateChange catches token expiry
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Session renewed automatically
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to /login
  }
});
```

---

## 5. Authorization & RLS

### 5.1 RLS Policy Design Principles

**Defense in Depth**:
1. **Database Level**: RLS policies enforce access at PostgreSQL level
2. **Application Level**: React components check roles before rendering UI
3. **API Level**: Supabase Auth validates JWT tokens on every request

**Principle of Least Privilege**:
- Students: Can only see/update their own profile
- Dept Heads: Can only see/update students in their department
- Admins: Can see/update everything

### 5.2 RLS Policy Implementation

**Student Policies** (most restrictive):
```sql
-- Students can only view their own profile
CREATE POLICY "Students can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Students can update their own name only (role/status/dept locked)
CREATE POLICY "Students can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = 'student' -- Cannot change role
    AND status = (SELECT status FROM profiles WHERE id = auth.uid()) -- Cannot change status
    AND department_id = get_my_department() -- Cannot change department
  );
```

**Dept Head Policies** (department-scoped):
```sql
-- Dept Heads can view students in their department + own profile
CREATE POLICY "Dept Heads can view department profiles"
  ON profiles FOR SELECT
  USING (
    (get_my_role() = 'dept_head' AND department_id = get_my_department())
    OR auth.uid() = id
  );

-- Dept Heads can approve/disable students in their department
CREATE POLICY "Dept Heads can update department profiles"
  ON profiles FOR UPDATE
  USING (
    get_my_role() = 'dept_head'
    AND department_id = get_my_department()
    AND role = 'student' -- Can only modify Students
  )
  WITH CHECK (
    role = 'student' -- Cannot elevate to Dept Head/Admin
    AND department_id = get_my_department() -- Cannot reassign to other dept
  );
```

**Admin Policies** (unrestricted):
```sql
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_my_role() = 'admin');

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_my_role() = 'admin');

-- Admins can create new profiles (Dept Heads)
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- Admins can delete profiles (cleanup)
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (get_my_role() = 'admin');
```

### 5.3 Application-Level Guards

**RoleGuard Component** (Phase C):
```javascript
export const RoleGuard = ({ allowedRoles, children, fallback = null }) => {
  const { profile } = useSupabaseAuth();

  if (!allowedRoles.includes(profile?.role)) {
    return fallback || <Navigate to="/unauthorized" />;
  }

  return children;
};

// Usage:
<RoleGuard allowedRoles={['admin']}>
  <AdminDashboard />
</RoleGuard>
```

---

## 6. Phase-by-Phase Design

### Phase A: Supabase Setup (Backend Only)

**Deliverables**:
1. Supabase project created (manual, by reviewer)
2. Environment variables configured
3. SQL schema executed
4. Supabase client configured

**File Structure**:
```
src/lib/supabaseClient.js           # NEW
.env.local                          # NEW (gitignored)
.gitignore                          # VERIFY includes .env*
```

**Environment Variables** (`.env.local`):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**SQL Execution Order**:
1. Create ENUM types (user_role, user_status)
2. Create departments table
3. Insert seed department ("General")
4. Create profiles table with constraints
5. Create RLS helper functions (get_my_role, get_my_department)
6. Enable RLS on tables
7. Create RLS policies
8. Create triggers (updated_at auto-update)
9. Create indexes

**Verification Steps**:
- Run `npm list @supabase/supabase-js` → Package installed
- Check Supabase Dashboard → Tables visible
- Check Supabase Dashboard → RLS policies visible
- Run test query as admin → No recursion errors

---

### Phase B: Registration, Login, Protected Routes

**Deliverables**:
1. Registration page with department dropdown
2. Login page with status checks
3. AuthContext provider
4. ProtectedRoute updates
5. Profile creation logic (application code)

**Component Design**:

**Register Page** (`src/pages/Register.jsx`):
```jsx
const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    departmentId: ''
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (data) setDepartments(data);
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create auth.users record
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      // Step 2: Create profiles record (explicit, NOT trigger)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: formData.fullName,
          role: 'student',
          department_id: formData.departmentId,
          status: 'pending'
        });

      if (profileError) throw profileError;

      // Step 3: Show success message
      toast.success('Registration submitted. Your account is pending approval.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        
        {/* Full Name Input */}
        <input
          type="text"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          required
        />

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          minLength={8}
          required
        />

        {/* Department Dropdown */}
        <select
          value={formData.departmentId}
          onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
          required
        >
          <option value="">Select Department</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
};
```

**Login Page** (`src/pages/Login.jsx`):
```jsx
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Show error from ProtectedRoute if redirected due to pending/disabled
  useEffect(() => {
    if (location.state?.error === 'pending') {
      setError('Your account is pending approval. Please contact your department head.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Step 2: Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Step 3: Check status
      if (profile.status === 'pending') {
        await supabase.auth.signOut();
        setError('Your account is pending approval. Please contact your department head.');
        return;
      }

      if (profile.status === 'disabled') {
        await supabase.auth.signOut();
        setError('Your account has been disabled. Please contact an administrator.');
        return;
      }

      // Step 4: Route by role
      if (profile.role === 'admin') {
        navigate('/admin');
      } else if (profile.role === 'dept_head') {
        navigate('/dept-head');
      } else if (profile.role === 'student') {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Invalid email or password' 
        : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <p className="mt-4 text-sm">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
};
```

**App.tsx Route Updates**:
```jsx
<BrowserRouter>
  <AuthProvider> {/* NEW: Wrap entire app */}
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected training app routes (existing, now behind ProtectedRoute) */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="rooms" element={<Rooms />} />
        {/* ...other training routes */}
      </Route>

      {/* Admin/Dept Head routes (Phase C/D) */}
      <Route path="/admin" element={
        <ProtectedRoute requireRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dept-head" element={
        <ProtectedRoute requireRole="dept_head">
          <DeptHeadDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

---

### Phase A.5: Supabase Edge Function for Privileged Operations

**CRITICAL**: Admin user creation CANNOT be done client-side due to security and session hijacking issues.

**Problem Statement**:
- `supabase.auth.signUp()` is unprivileged (used by students for self-registration)
- `supabase.auth.admin.createUser()` requires service_role key (must NEVER be exposed in client code)
- Calling `signUp()` from Admin's browser would switch Admin's session to the new Dept Head (session hijacking)

**Solution**: Supabase Edge Function with service_role key

**Deliverables**:
- Edge Function `create-dept-head` deployed to Supabase
- Function uses service_role key (stored in Supabase secrets, not in client code)
- Function performs atomic operation: create auth user + profiles row + update departments

**Phase Placement Rationale**:
- Placed AFTER Phase A (database setup) but BEFORE Phase C (Admin dashboard)
- Admin dashboard depends on this function, so it must exist first
- Can be tested independently before UI is built

**File Structure**:
```
supabase/
└── functions/
    └── create-dept-head/
        └── index.ts
```

**Edge Function Implementation** (`supabase/functions/create-dept-head/index.ts`):
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // CORS headers for browser requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    // Parse request body
    const { full_name, email, password, department_id } = await req.json();

    // Validate required fields
    if (!full_name || !email || !password || !department_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase Admin Client with service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify requesting user is an admin (check JWT token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user has admin role
    const { data: requestorProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || requestorProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify department exists
    const { data: department, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('id')
      .eq('id', department_id)
      .single();

    if (deptError || !department) {
      return new Response(
        JSON.stringify({ error: 'Invalid department ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Create auth.users record via Admin API (auto-confirmed)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (no verification needed)
      user_metadata: {
        full_name
      }
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Create profiles record
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        role: 'dept_head',
        department_id,
        status: 'approved' // Dept heads are pre-approved
      });

    if (profileInsertError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile: ' + profileInsertError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Update departments table (assign dept head)
    const { error: deptUpdateError } = await supabaseAdmin
      .from('departments')
      .update({ dept_head_id: authData.user.id })
      .eq('id', department_id);

    if (deptUpdateError) {
      // Note: Don't rollback here - dept head is created successfully,
      // just the department assignment failed. Admin can reassign manually.
      console.error('Department update failed:', deptUpdateError);
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        dept_head_id: authData.user.id,
        email: authData.user.email,
        message: 'Dept Head created successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
```

**Deployment**:
```bash
# Install Supabase CLI (one-time)
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref <project-id>

# Deploy Edge Function
supabase functions deploy create-dept-head

# Set service role key secret (stored securely in Supabase, NOT in code)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

**Security Notes**:
- Service role key NEVER leaves Supabase infrastructure
- Function validates requesting user is an admin (JWT token check)
- Function returns 403 if non-admin attempts to call it
- RLS policies still apply to database operations (defense in depth)

**Verification**:
- Deploy function to Supabase
- Test function via Supabase Dashboard > Edge Functions > Test
- Verify function can create dept head without hijacking admin session
- Verify non-admin cannot call function (403 Forbidden)

**Checkpoint**: Developer SHALL NOT proceed to Phase C until reviewer confirms Phase A.5 is complete.

---

### Phase C: Admin Dashboard & Dept Head Creation

**Deliverables**:
1. Admin dashboard page
2. Create Dept Head form/modal (calls Edge Function)
3. Create Department form/modal
4. User list view (all users)
5. First Admin account creation (manual)

**Admin Dashboard Layout**:
```
┌────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                             [Logout] [👤] │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  DEPARTMENTS                   [+ Create Department] │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │  │
│  │  │  General     │  │  Front Desk  │  │  F&B      │ │  │
│  │  │  Dept Head:  │  │  Dept Head:  │  │  Dept Head│ │  │
│  │  │  John Doe    │  │  Jane Smith  │  │  None     │ │  │
│  │  │  Students: 5 │  │  Students: 3 │  │  Students │ │  │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  USERS                        [+ Create Dept Head]  │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  ┌─ Admins ─────────────────────────────────────┐   │  │
│  │  │  • Admin User (admin@example.com)            │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌─ Dept Heads ─────────────────────────────────┐   │  │
│  │  │  • John Doe (john@example.com) - General     │   │  │
│  │  │  • Jane Smith (jane@example.com) - Front Desk│   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌─ Students (Pending: 3) ─────────────────────┐   │  │
│  │  │  • Alice Student (alice@...) - General [Approve]│ │
│  │  │  • Bob Student (bob@...) - F&B [Approve]    │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌─ Students (Approved: 8) ────────────────────┐   │  │
│  │  │  • Charlie (charlie@...) - General [Disable]│   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Create Dept Head Flow (CORRECTED)**:
```
Admin clicks "+ Create Dept Head"
    │
    ▼
Modal opens with form:
    - Full Name
    - Email
    - Password (generate or manual)
    - Department (dropdown)
    │
    ▼
On submit:
    Frontend calls Supabase Edge Function:
    
    const { data, error } = await supabase.functions.invoke('create-dept-head', {
      body: {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        department_id: formData.departmentId
      }
    });
    │
    ▼
Edge Function (server-side):
    1. Verify requesting user is admin (JWT token check)
    2. Create auth.users via admin.createUser() (auto-confirm)
    3. Create profiles record (role='dept_head', status='approved')
    4. Update departments.dept_head_id
    5. Return success (admin's session UNCHANGED)
    │
    ▼
Frontend receives success:
    - Show success toast: "Dept Head created successfully"
    - Refresh user list
    - Close modal
    │
    ▼
Dept Head can log in immediately (auto-confirmed)
Admin remains logged in as admin (session not hijacked)
```

**CreateDeptHeadModal Component**:
```jsx
const CreateDeptHeadModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    departmentId: ''
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      if (data) setDepartments(data);
    };
    if (isOpen) fetchDepartments();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call Edge Function (NOT supabase.auth.signUp!)
      const { data, error: invokeError } = await supabase.functions.invoke('create-dept-head', {
        body: {
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password,
          department_id: formData.departmentId
        }
      });

      if (invokeError) throw invokeError;
      if (data.error) throw new Error(data.error);

      toast.success('Dept Head created successfully');
      onSuccess(); // Refresh user list
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2>Create Department Head</h2>
        
        <input
          type="text"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />

        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          minLength={8}
          required
        />

        <select
          value={formData.departmentId}
          onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
          required
        >
          <option value="">Select Department</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>

        {error && <div className="text-red-500">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Dept Head'}
        </button>
      </form>
    </Modal>
  );
};
```

**First Admin Creation** (manual, Phase C):
```
1. Reviewer creates first user via Supabase Dashboard:
   - Navigate to Authentication > Users
   - Click "Invite User" or "Add User"
   - Email: admin@example.com
   - Password: (secure password)
   - Confirm email: Yes (manual confirmation)

2. Reviewer manually updates profiles table via SQL:
   INSERT INTO profiles (id, full_name, role, status)
   VALUES (
     '(user_id_from_step_1)',
     'System Administrator',
     'admin',
     'approved'
   );

3. Admin logs in at /login, redirected to /admin

NOTE: First admin creation does NOT need the Edge Function because:
- Done manually via Supabase Dashboard (not client code)
- One-time operation (not a recurring workflow)
- No session hijacking risk (admin doesn't exist yet)
```

**Phase C Testing**:
- [ ] Admin can create new departments
- [ ] Admin can create Dept Head via Edge Function
- [ ] Created Dept Head can log in immediately
- [ ] Admin remains logged in as admin (session not hijacked)
- [ ] Edge Function rejects non-admin callers (403 Forbidden)
- [ ] Admin can view all users (students, dept heads, admins)
- [ ] Admin can change user status (pending → approved → disabled)

---

### Phase D: Dept Head Dashboard & Student Approval

**Deliverables**:
1. Dept Head dashboard page
2. Pending students list (filtered by department)
3. Approved students list (filtered by department)
4. Approve/Reject buttons with status updates

**Dept Head Dashboard Layout**:
```
┌────────────────────────────────────────────────────────────┐
│  DEPT HEAD DASHBOARD - General Department    [Logout] [👤] │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  PENDING REGISTRATIONS (3)                          │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │  Alice Student                              │    │  │
│  │  │  alice@example.com                          │    │  │
│  │  │  Registered: 2026-08-10                     │    │  │
│  │  │              [Approve]    [Reject]          │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │  Bob Student                                │    │  │
│  │  │  bob@example.com                            │    │  │
│  │  │  Registered: 2026-08-11                     │    │  │
│  │  │              [Approve]    [Reject]          │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  APPROVED STUDENTS (8)                              │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  • Charlie Student (charlie@...) [Disable]          │  │
│  │  • Diana Student (diana@...) [Disable]              │  │
│  │  • ...                                              │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Approval Flow (RLS Enforced)**:
```
Dept Head clicks "Approve" on Alice Student
    │
    ▼
Frontend sends UPDATE request:
    UPDATE profiles
    SET status = 'approved'
    WHERE id = 'alice-student-uuid'
    │
    ▼
RLS Policy checks:
    1. Is current user a dept_head? (get_my_role() = 'dept_head') ✓
    2. Is Alice in my department? (alice.department_id = get_my_department()) ✓
    3. Is Alice a student? (alice.role = 'student') ✓
    │
    ▼
UPDATE allowed, Alice's status → 'approved'
    │
    ▼
Alice can now log in and access /dashboard
```

**Reject Flow**:
```
Dept Head clicks "Reject" → Confirmation dialog:
"Are you sure you want to reject this registration?"
    │
    ▼
Confirm → UPDATE profiles SET status = 'disabled' WHERE id = student_id
    │
    ▼
Student cannot log in (status check in Login page rejects disabled users)
```

---

### Phase E: Integration & Polish

**Deliverables**:
1. Update useHotelStore.currentUser to use Supabase data
2. Update TopHeader to display Supabase user's full_name
3. Update logout to call Supabase signOut()
4. Preserve role switcher for training operational roles
5. Test all existing training features with Supabase auth

#### **CRITICAL: currentUser.role Field Collision Analysis**

**Existing Usage Grep Results**:

```bash
# Files that reference currentUser.role:
src/store/useHotelStore.js:18:  currentUser: { name: "IT ADMIN", role: "manager", username: "admin" }
src/store/useHotelStore.js:53:    currentUser: { name: username.toUpperCase() || "DEMO USER", role: role || "manager", username: username || "admin" }
src/pages/CancelBooking.jsx:285:  {currentUser?.role === "hotel_manager" && (

# Files that reference currentUser (but NOT .role):
src/store/useHotelStore.js:352:      waiterName: state.currentUser.name,
src/store/useHotelStore.js:447:      // Persist all data except currentUser
src/hooks/useAuth.js:5:  const currentUser = useHotelStore((state) => state.currentUser);
src/components/layout/TopHeader.jsx:11:  const { currentUser, logout } = useAuth();
src/components/layout/TopHeader.jsx:98:              {currentUser?.name || "IT ADMIN"}
src/components/rooms/RoomDetailSheet.jsx:48:  const currentUser = useHotelStore((state) => state.currentUser);
src/components/rooms/RoomDetailSheet.jsx:532:          LAST MODIFIED: {todayFormatted} 19:52 BY {currentUser?.name || "IT ADMIN"}
src/pages/Dashboard.jsx:32:  const { currentUser } = useAuth();
src/pages/Dashboard.jsx:90:          BS/GN V[6.5] &nbsp;&nbsp; SP V[1] &nbsp;&nbsp; USER: <span className="font-bold text-yellow-300">{currentUser?.name || "IT ADMIN"}</span>
src/pages/waiter/WaiterLanding.jsx:9:  const currentUser = useHotelStore((state) => state.currentUser);
src/pages/waiter/WaiterLanding.jsx:96:                <span className="text-gray-900">{currentUser?.name || "Unknown"}</span>
src/pages/AssignRoom.jsx:20:  const currentUser = useHotelStore((state) => state.currentUser);
```

**Analysis**:

1. **ONE REAL USAGE** of `currentUser.role`:
   - `src/pages/CancelBooking.jsx:285`: Checks `currentUser?.role === "hotel_manager"` to show manager access badge
   
2. **PROBLEM**: This checks for `"hotel_manager"` (training operational role), but Supabase auth will store `"admin"`, `"dept_head"`, or `"student"` (auth hierarchy roles)

3. **COLLISION IMPACT**:
   - If we overwrite `currentUser.role` with Supabase auth role, `CancelBooking.jsx` will BREAK
   - The manager badge will never show (since no Supabase user has role === "hotel_manager")

**Solution: Rename Field to Avoid Collision**

**Updated currentUser Structure** (Phase E):
```javascript
// OLD (demo mode):
currentUser: {
  name: "IT ADMIN",
  role: "manager",        // REMOVED (conflicts with training role)
  username: "admin"
}

// NEW (Supabase auth):
currentUser: {
  id: "uuid-123",               // NEW: Supabase user ID
  email: "student@example.com", // NEW: Email from auth.users
  full_name: "Alice Student",   // NEW: From profiles.full_name
  authRole: "student",          // NEW: Auth hierarchy role (admin/dept_head/student)
  department_id: "dept-uuid",   // NEW: From profiles.department_id
  status: "approved",           // NEW: From profiles.status
  username: "alice"             // KEEP: For backward compat (derived from email)
  // NOTE: Training operational role stored in useRoleStore.currentRole (unchanged)
}
```

**CancelBooking.jsx Fix** (Phase E):
```javascript
// OLD:
{currentUser?.role === "hotel_manager" && (
  <div>Manager Access Badge</div>
)}

// NEW: Use training operational role from useRoleStore
const currentRole = useRoleStore(state => state.currentRole);

{currentRole === "hotel_manager" && (
  <div>Manager Access Badge</div>
)}
```

**Justification for Renaming**:
- `authRole` clearly distinguishes auth hierarchy (admin/dept_head/student) from training role (hotel_manager/waiter_fnb/etc.)
- Avoids breaking existing `currentUser.role` check in CancelBooking.jsx
- Future-proof: No ambiguity between the two role systems

**Updated AuthContext** (Phase E):
```javascript
// In fetchProfile():
setCurrentUser({
  id: data.id,
  email: user.email,
  full_name: data.full_name,
  authRole: data.role, // NOT "role" - use "authRole" to avoid collision
  department_id: data.department_id,
  status: data.status,
  username: user.email.split('@')[0] // Derive username for backward compat
});
```

**Phase E Integration Checklist**:
- [ ] Update `useHotelStore.currentUser` structure (add authRole, remove old role)
- [ ] Update `AuthContext.fetchProfile()` to populate new structure
- [ ] Update `CancelBooking.jsx` to use `useRoleStore.currentRole` instead of `currentUser.role`
- [ ] Verify `TopHeader.jsx` displays `currentUser.full_name` (already uses .name, just need to map full_name → name or update template)
- [ ] Verify waiter order creation uses `currentUser.full_name` instead of `currentUser.name`
- [ ] Test role switcher still works (useRoleStore unchanged)
- [ ] Test demo reset still works (training data reset, not auth data)

---

## 7. Integration Strategy

### 7.1 Backward Compatibility

**Existing Features That Must Continue Working**:
- Role switcher (useRoleStore)
- Hotel operations (rooms, reservations, check-in/out)
- F&B waiter interface
- Housekeeping module
- Reports
- Demo reset

**Strategy**:
1. **Two-Store Pattern**: Keep useRoleStore separate from auth (training roles vs. auth roles)
2. **Field Renaming**: Use `authRole` instead of `role` in currentUser to avoid collision
3. **Gradual Migration**: Phase E updates existing components one by one, test after each change
4. **Fallback Values**: Use `currentUser?.full_name || currentUser?.name || "Unknown User"` for graceful degradation

### 7.2 Demo Mode Removal

**Design Decision: REMOVE demo mode entirely**

**Rationale**:
- Authentication is now required for all users
- "Guest preview" mode adds complexity without clear value (students register for free)
- Simpler mental model: Everyone authenticates, role switcher available to students

**Changes**:
- Remove "Demo Mode" badge from TopHeader
- Remove login/logout buttons from existing demo (auth required from start)
- Update README to document registration process

**Alternative (if guest preview needed)**:
- Create a public-facing demo route `/demo` with read-only access
- Seed a demo student account with approved status
- Redirect unauthenticated users to `/demo` instead of `/login`

### 7.3 Email Verification

**Design Decision: NO email verification (Phase 1-5)**

**Rationale**:
- Approval workflow already provides verification (Dept Head reviews registrations)
- Email verification adds friction without added security (Dept Heads manually vet students)
- Supabase supports email verification, but deferred to future enhancement

**Future Enhancement**:
- Enable Supabase email confirmation in project settings
- Update registration flow to show "Check your email to verify" message
- Update login to block unverified emails

### 7.4 Password Reset

**Design Decision: DEFER to future enhancement**

**Rationale**:
- Not critical for MVP (admins can manually reset passwords via Supabase Dashboard)
- Supabase provides built-in password reset via magic links
- Deferred to post-Phase-E enhancement

**Future Implementation**:
- Add "Forgot password?" link on login page
- Call `supabase.auth.resetPasswordForEmail(email)`
- Supabase sends email with reset link
- User clicks link → Redirected to password reset page

### 7.5 First Admin Creation

**Design Decision: Manual creation via Supabase Dashboard**

**Rationale**:
- One-time operation (only first admin needs manual creation)
- Supabase Dashboard provides secure interface for user creation
- Avoids building custom admin bootstrap wizard for single-use feature

**Process**:
1. Reviewer creates user via Supabase Dashboard > Authentication > Users
2. Reviewer manually inserts profiles row via SQL editor
3. Admin logs in, creates Dept Heads via UI

**Alternative (future enhancement)**:
- Build one-time setup wizard route `/setup`
- Check if any admin exists: `SELECT COUNT(*) FROM profiles WHERE role = 'admin'`
- If 0, show setup form; if >0, redirect to /login
- After first admin created, hide /setup route

---

## 8. Design Decisions

### 8.1 Resolved Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Profile Creation** | Application code (NOT trigger) | Clearer error handling, more control, easier debugging |
| **Department Assignment** | Required at registration | Simpler workflow, avoids NULL RLS issues, seed data resolves phase sequencing |
| **Demo Mode** | Remove entirely | Authentication required for all, simpler mental model |
| **Email Verification** | Disabled (Phase 1-5) | Approval workflow provides verification, defer to future |
| **Password Reset** | Deferred | Not critical for MVP, Supabase supports it, add post-Phase-E |
| **First Admin Creation** | Manual (Supabase Dashboard) | One-time operation, no need for custom wizard |
| **currentUser.role Collision** | Rename to authRole | Avoids breaking CancelBooking.jsx, clear separation of concerns |

### 8.2 Open Questions (Phase E)

1. **Demo Reset Behavior**: Should demo reset clear auth data (log out user) or only reset training data?
   - Recommendation: Only reset training data, keep user logged in
   
2. **Student Self-Profile Edit**: Should students be able to edit their full_name after registration?
   - Recommendation: Yes, but not email/password (use Supabase built-in profile update)

3. **Dept Head Reassignment**: Can Admin reassign students to different departments after approval?
   - Recommendation: Yes, Admin can update profiles.department_id via UI

---

## 9. Security Considerations

### 9.1 Authentication Security

**Password Storage**:
- Supabase Auth handles bcrypt hashing automatically
- Application never sees plaintext passwords
- Min password length: 8 characters (configurable in Supabase)

**Session Management**:
- JWT tokens with 1-hour expiry (Supabase default)
- Refresh tokens automatically renew session
- Tokens stored in httpOnly cookies (XSS protection)

**Credential Exposure**:
- Supabase anon key is PUBLIC (safe to commit, limited permissions)
- Supabase service_role key is SECRET (never use in client code)
- Environment variables in .env.local (gitignored)

### 9.2 Authorization Security

**RLS Defense in Depth**:
- Database level: PostgreSQL RLS enforces policies
- Application level: React components check roles before rendering
- API level: Supabase validates JWT on every request

**RLS Bypass Prevention**:
- Helper functions use SECURITY DEFINER (bypass RLS safely)
- Direct user queries use USING/WITH CHECK clauses (cannot bypass)
- Admin access auditable via Supabase logs

### 9.3 Input Validation

**Client-side**:
- Email format validation (HTML5 input type="email")
- Password length validation (minLength={8})
- Required field validation (HTML5 required attribute)

**Server-side**:
- Supabase Auth validates email format
- Supabase Auth enforces password requirements
- Database constraints enforce UNIQUE email, NOT NULL fields

### 9.4 SQL Injection Prevention

**Supabase Query Builder**:
- Parameterized queries (no string concatenation)
- Automatic escaping of user input
- No raw SQL in application code

**Example** (safe):
```javascript
// SAFE: Parameterized query
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId); // userId automatically escaped
```

### 9.5 XSS Prevention

**React Built-in Protection**:
- JSX escapes user input by default
- `dangerouslySetInnerHTML` NOT used in auth components
- User-provided names/emails rendered as text nodes (auto-escaped)

---

## 10. Testing Strategy

### 10.1 Phase A Testing

- [ ] Supabase client initializes without errors
- [ ] Environment variables load correctly
- [ ] SQL schema executes without syntax errors
- [ ] RLS helper functions return expected values
- [ ] Seed department "General" exists in departments table
- [ ] No RLS recursion errors when querying profiles as admin

### 10.2 Phase B Testing

- [ ] Registration form validates input (email format, password length)
- [ ] Registration creates auth.users + profiles records atomically
- [ ] Pending student cannot log in (status check rejects)
- [ ] Login redirects to correct dashboard by role (student/dept_head/admin)
- [ ] ProtectedRoute redirects unauthenticated users to /login
- [ ] Session persists across page refresh

### 10.3 Phase C Testing

- [ ] Admin can create new departments
- [ ] Admin can create Dept Head accounts
- [ ] Created Dept Head can log in immediately
- [ ] Admin can view all users (students, dept heads, admins)
- [ ] Admin can change user status (pending → approved → disabled)

### 10.4 Phase D Testing

- [ ] Dept Head sees only students in their department (RLS enforced)
- [ ] Dept Head can approve pending students
- [ ] Approved student can log in and access /dashboard
- [ ] Dept Head can reject students (status → disabled)
- [ ] Dept Head CANNOT see students from other departments
- [ ] Dept Head CANNOT approve students from other departments (RLS blocks)

### 10.5 Phase E Testing

- [ ] Approved student lands in training app unchanged
- [ ] TopHeader displays Supabase user's full_name
- [ ] Role switcher works (student can practice hotel_manager, waiter_fnb, etc.)
- [ ] CancelBooking.jsx manager badge shows correctly (uses useRoleStore.currentRole)
- [ ] Logout calls Supabase signOut() and redirects to /login
- [ ] Demo reset clears training data, keeps user logged in
- [ ] All existing features work unchanged (rooms, reservations, F&B, housekeeping)

---

## 11. Performance Considerations

### 11.1 Query Optimization

**Indexed Queries**:
- Dept Head dashboard filters by `department_id` (indexed)
- Admin dashboard filters by `role` and `status` (both indexed)
- RLS helper functions query by `id` (primary key, always indexed)

**Expected Query Times** (Supabase free tier):
- Profile fetch after login: <200ms
- Department list load: <100ms (small table, rarely changes)
- Student list load: <300ms (indexed query, RLS filter applied)

### 11.2 RLS Performance

**Concern**: RLS adds overhead to every query (policy evaluation)

**Mitigation**:
- Helper functions use simple lookups (no JOINs)
- Policies use indexed columns (department_id, role)
- STABLE keyword allows Postgres to cache helper function results

**Benchmarking** (Phase A):
- Run test queries as dept_head: `SELECT * FROM profiles WHERE role = 'student'`
- Verify query time <300ms
- If slow, add composite index: `CREATE INDEX idx_profiles_dept_role ON profiles(department_id, role)`

### 11.3 Session Storage

**Supabase Session Cookies**:
- Small size (~2KB JWT token)
- Automatic refresh (no manual polling)
- Secure httpOnly cookies (XSS protection)

**No Performance Impact**:
- Session check happens once on app init (AuthContext useEffect)
- Subsequent checks use in-memory state (no network requests)

---

## 12. Error Handling

### 12.1 Supabase Error Types

**Authentication Errors**:
- `Invalid login credentials`: Wrong email/password
- `Email already registered`: Duplicate signup
- `Invalid email format`: Client-side validation failed
- `Weak password`: Password too short

**Database Errors**:
- `duplicate key value`: Unique constraint violation (email, department name)
- `foreign key violation`: Invalid department_id reference
- `check constraint violation`: Role/status constraint failed

**Network Errors**:
- `Network error`: Supabase unreachable
- `Timeout`: Query took too long (>30s default)

### 12.2 Error Handling Strategy

**User-Facing Messages**:
```javascript
const getErrorMessage = (error) => {
  if (error.message.includes('Invalid login credentials')) {
    return 'Invalid email or password';
  }
  if (error.message.includes('already registered')) {
    return 'Email already registered';
  }
  if (error.code === '23505') { // Postgres unique violation
    return 'This value is already in use';
  }
  // Generic fallback
  return 'An error occurred. Please try again.';
};
```

**Logging Strategy**:
- Client-side: `console.error()` for debugging
- Server-side: Supabase Dashboard > Logs for production monitoring
- No sensitive data logged (passwords, tokens)

---

## 13. Deployment Considerations

### 13.1 Environment Variables

**Development** (`.env.local`):
```
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (dev anon key)
```

**Production** (Vercel/Netlify environment variables):
```
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (prod anon key)
```

**Security**:
- Never commit .env.local to git
- Rotate anon key if accidentally exposed (Supabase Dashboard > Settings > API)
- Use different Supabase projects for dev/staging/prod

### 13.2 Database Migrations

**Phase A Initial Setup**:
- Run schema SQL once in Supabase SQL editor
- Verify tables/policies created successfully
- Export schema for backup: Supabase Dashboard > Database > Backup

**Future Schema Changes**:
- Use Supabase CLI migrations: `supabase migration new add_column`
- Test in dev environment first
- Apply to production: `supabase db push`

### 13.3 Rollback Strategy

**If Phase E Breaks Training App**:
1. Revert to pre-Phase-E commit
2. Redeploy application
3. Supabase data persists (no rollback needed)
4. Debug issue in dev, re-deploy when fixed

**Database Rollback**:
- Supabase provides Point-in-Time Recovery (PITR) for paid tiers
- Free tier: Manual SQL to restore data from backups
- Always export schema before major changes

---

## 14. Documentation

### 14.1 User Documentation (Phase E)

**For Students**:
- How to register (department selection, approval process)
- How to log in (email/password, password requirements)
- What to do if pending (contact dept head)
- How to use training app (role switcher, features)

**For Dept Heads**:
- How to log in (pre-provisioned by admin)
- How to approve/reject students
- How to disable approved students
- How to view student list

**For Admins**:
- How to create departments
- How to create dept heads
- How to manage all users
- How to reassign users to different departments

### 14.2 Developer Documentation

**README Updates** (Phase E):
- Add "Authentication" section
- Document Supabase setup steps
- Document environment variables
- Document first admin creation process

**Code Comments**:
- Document RLS helper functions (why SECURITY DEFINER needed)
- Document currentUser structure (authRole vs. training role)
- Document two-layer role system (auth vs. operational)

---

**Design Document Version**: 1.0  
**Date**: 2026-08-12  
**Status**: Draft - Awaiting Reviewer Approval  
**Next Phase**: tasks.md (after design approval)
