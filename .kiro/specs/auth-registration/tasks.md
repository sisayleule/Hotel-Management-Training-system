# Task Breakdown: Authentication & Access Control

## Document Information

**Tasks Document Version**: 1.0  
**Date**: 2026-08-12  
**Status**: Awaiting Approval to Begin Implementation  
**Requirements Document**: requirements.md (Approved)  
**Design Document**: design.md (Approved)  
**Implementation Status**: NOT STARTED

---

## Implementation Rules

1. **Phase Sequence**: Phases MUST be completed in order: A → A.5 → B → C → D → E
2. **Checkpoints**: Developer SHALL NOT proceed to next phase until reviewer confirms checkpoint with real evidence
3. **Reviewer Actions**: Tasks marked **[REVIEWER ACTION]** require reviewer to perform action outside developer's control
4. **Developer Actions**: Tasks marked **[DEVELOPER ACTION]** are performed by developer
5. **Verification**: Every checkpoint requires real evidence (screenshots, SQL query results, function test results)
6. **No Skipping**: Developer SHALL NOT implement any code until reviewer approves this tasks.md document

---

## Phase A: Supabase Backend Setup

**Requirements Traceability**: Req 1, Req 2  
**Estimated Time**: 2-3 hours  
**Dependencies**: None

### Task A.1: Supabase Project Creation **[REVIEWER ACTION]**

**Owner**: Reviewer  
**Traceability**: Req 1.1, Req 1.2

1.1. Navigate to https://supabase.com  
1.2. Create new project (or use existing project)  
1.3. Note project details:
     - Project URL: `https://xxxxx.supabase.co`
     - Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - Service role key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret)  
1.4. Provide developer with Project URL and Anon key ONLY (NOT service role key)

**Deliverable**: Project URL + Anon key shared with developer

---

### Task A.2: Install Supabase Client Library **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 1.3

2.1. Run: `npm install @supabase/supabase-js`  
2.2. Verify installation: `npm list @supabase/supabase-js`  
2.3. Confirm version ^2.x installed

**Deliverable**: Package installed, version confirmed

---

### Task A.3: Configure Environment Variables **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 1.4, Req 1.5, Req 1.6

3.1. Create `.env.local` file in project root (if not exists)  
3.2. Add environment variables:
     ```
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
3.3. Verify `.gitignore` contains `.env*` pattern  
3.4. If not, add `.env*` to `.gitignore`

**Deliverable**: `.env.local` created (gitignored), environment variables configured

---

### Task A.4: Create Supabase Client Configuration **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 1.9, Req 1.10

4.1. Create file: `src/lib/supabaseClient.js`  
4.2. Implement Supabase client singleton:
     ```javascript
     import { createClient } from '@supabase/supabase-js';

     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
     const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

     if (!supabaseUrl || !supabaseAnonKey) {
       throw new Error('Missing Supabase environment variables');
     }

     export const supabase = createClient(supabaseUrl, supabaseAnonKey);
     ```
4.3. Test import in browser console: `import { supabase } from './src/lib/supabaseClient.js'`  
4.4. Verify no errors, supabase object exists

**Deliverable**: `src/lib/supabaseClient.js` created, tested successfully

---

### Task A.5: Prepare SQL Schema Script **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 2.1, Req 2.2, Req 2.3, Req 2.4, Req 2.5-15

5.1. Create SQL file: `.kiro/specs/auth-registration/schema.sql`  
5.2. Write complete schema in execution order:
     - Create ENUM types (user_role, user_status)
     - Create departments table
     - Insert seed department ("General")
     - Create profiles table with constraints
     - Create RLS helper functions (get_my_role, get_my_department)
     - Enable RLS on tables
     - Create all RLS policies (Students, Dept Heads, Admins, Departments)
     - Create triggers (updated_at auto-update)
     - Create indexes (department_id, role, status)  
5.3. Validate SQL syntax (no typos, correct Postgres syntax)  
5.4. Add comments explaining each section

**Deliverable**: `schema.sql` file ready for reviewer to execute

**SQL File Contents** (complete executable script):

```sql
-- ============================================================================
-- AUTHENTICATION & ACCESS CONTROL DATABASE SCHEMA
-- Fortune Next v6.5 Hotel Management Training PMS
-- Date: 2026-08-12
-- ============================================================================

-- ============================================================================
-- STEP 0: Enable UUID extension (required for uuid_generate_v4())
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: Create ENUM types (idempotent)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'dept_head', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'disabled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Create departments table WITHOUT FK constraint (idempotent)
-- (dept_head_id FK will be added in Step 6 after profiles table exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  dept_head_id UUID, -- Plain column, FK constraint added later
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Insert seed department for Phase B testing (idempotent)
-- ============================================================================

INSERT INTO departments (name) 
VALUES ('General')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 4: Create profiles table (idempotent)
-- (Can reference departments.id since departments already exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_dept_head_has_department 
    CHECK (role != 'dept_head' OR department_id IS NOT NULL),
  CONSTRAINT check_admin_no_department
    CHECK (role != 'admin' OR department_id IS NULL)
);

-- ============================================================================
-- STEP 5: Create indexes for performance (idempotent)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- ============================================================================
-- STEP 6: Add deferred FK constraint to departments.dept_head_id (idempotent)
-- (Now that both tables exist, safe to add circular FK)
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE departments
    ADD CONSTRAINT fk_departments_dept_head
    FOREIGN KEY (dept_head_id) REFERENCES profiles(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 7: Create RLS helper functions (prevent recursion)
-- ============================================================================

-- Get current user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's department (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_department()
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's status (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_status()
RETURNS user_status AS $$
  SELECT status FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 8: Enable RLS
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: Create RLS policies for profiles table (idempotent)
-- ============================================================================

-- Students can view their own profile only
DROP POLICY IF EXISTS "Students can view own profile" ON profiles;
CREATE POLICY "Students can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Students can update their own profile (name only, role/status/dept locked)
DROP POLICY IF EXISTS "Students can update own profile" ON profiles;
CREATE POLICY "Students can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = 'student' -- Cannot change role
    AND status = get_my_status() -- Cannot change status
    AND department_id = get_my_department() -- Cannot change department
  );

-- Users can insert their own profile during registration
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON profiles;
CREATE POLICY "Users can insert own profile during registration"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'student'
    AND status = 'pending'
  );

-- Dept Heads can view profiles in their department + own profile
DROP POLICY IF EXISTS "Dept Heads can view department profiles" ON profiles;
CREATE POLICY "Dept Heads can view department profiles"
  ON profiles FOR SELECT
  USING (
    (get_my_role() = 'dept_head' AND department_id = get_my_department())
    OR auth.uid() = id
  );

-- Dept Heads can update students in their department (approve/disable)
DROP POLICY IF EXISTS "Dept Heads can update department profiles" ON profiles;
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

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_my_role() = 'admin');

-- Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_my_role() = 'admin');

-- Admins can insert new profiles (for Edge Function)
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- Admins can delete profiles (cleanup)
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (get_my_role() = 'admin');

-- ============================================================================
-- STEP 10: Create RLS policies for departments table (idempotent)
-- ============================================================================

-- Anyone can view departments (needed for public registration form dropdown)
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
CREATE POLICY "Anyone can view departments"
  ON departments FOR SELECT
  USING (true);

-- Only Admins can manage departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  USING (get_my_role() = 'admin');

-- ============================================================================
-- STEP 11: Create triggers for auto-updating timestamps (idempotent)
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for departments table
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Verify tables exist: SELECT * FROM profiles; SELECT * FROM departments;
-- Verify seed data: SELECT * FROM departments WHERE name = 'General';
-- Verify RLS enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('profiles', 'departments');
-- Verify FK constraint: SELECT conname FROM pg_constraint WHERE conname = 'fk_departments_dept_head';
-- ============================================================================
```  SELECT * FROM departments WHERE name = 'General';
     ```
6.9. Confirm seed department exists (1 row returned)

**Deliverable**: SQL executed successfully, tables + policies + seed data visible in Supabase Dashboard

---

### ✅ CHECKPOINT A: Phase A Complete

**Reviewer must confirm ALL of the following before developer proceeds to Phase A.5**:

**Evidence Required**:
1. **Screenshot**: Supabase Dashboard > Database > Tables showing `profiles` and `departments` tables
2. **Screenshot**: Supabase Dashboard > Authentication > Policies showing RLS policies for both tables
3. **SQL Query Result**: `SELECT * FROM departments;` shows "General" department
4. **SQL Query Result**: `SELECT * FROM profiles;` returns 0 rows (table empty, ready for registrations)
5. **Terminal Output**: `npm list @supabase/supabase-js` showing version ^2.x installed
6. **Code Verification**: Developer confirms `src/lib/supabaseClient.js` exists and imports successfully

**Verification Method**: Reviewer runs test query in Supabase SQL Editor to confirm no RLS recursion:
```sql
-- This query should NOT error (would error if RLS has recursion)
SELECT get_my_role(); -- Should return NULL (no user logged in yet)
SELECT get_my_department(); -- Should return NULL
```

**Approval**: Reviewer types "Phase A approved, proceed to Phase A.5" in response

---

## Phase A.5: Supabase Edge Function Deployment

**Requirements Traceability**: Req 6 (Admin Dashboard), Req 9 (First Admin)  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase A complete

### Task A5.1: Create Edge Function Code **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Design Section 6 (Phase A.5)

1.1. Create directory: `supabase/functions/create-dept-head/`  
1.2. Create file: `supabase/functions/create-dept-head/index.ts`  
1.3. Implement Edge Function with complete TypeScript code (see design.md Section 6)  
1.4. Validate TypeScript syntax (no compilation errors)  
1.5. Add code comments explaining each step  
1.6. Verify function includes:
     - CORS headers handling
     - Request body validation
     - Admin role verification (JWT token check)
     - Admin API call: `supabase.auth.admin.createUser()`
     - Profiles table insert
     - Departments table update
     - Error handling with rollback
     - Success response

**Deliverable**: `supabase/functions/create-dept-head/index.ts` ready for deployment

**File Contents** (complete implementation):

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
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
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
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
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
        { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
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
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
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
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
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
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
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

---

### Task A5.2: Edge Function Deployment **[REVIEWER ACTION]**

**Owner**: Reviewer  
**Traceability**: Design Section 6 (Phase A.5)

**CRITICAL**: Developer cannot perform this task (requires reviewer's Supabase CLI login)

2.1. Install Supabase CLI (if not already installed):
     ```bash
     npm install -g supabase
     ```
2.2. Login to Supabase:
     ```bash
     supabase login
     ```
2.3. Link to project:
     ```bash
     supabase link --project-ref <project-id>
     ```
2.4. Deploy Edge Function:
     ```bash
     supabase functions deploy create-dept-head
     ```
2.5. Set service role key secret (stored securely in Supabase):
     ```bash
     supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_dashboard>
     ```
2.6. Navigate to Supabase Dashboard > Edge Functions  
2.7. Verify `create-dept-head` function appears in list with status "Active"

**Deliverable**: Edge Function deployed and visible in Supabase Dashboard

---

### Task A5.3: Edge Function Testing **[REVIEWER ACTION]**

**Owner**: Reviewer  
**Traceability**: Design Section 6 (Phase A.5)

3.1. Navigate to Supabase Dashboard > Edge Functions > create-dept-head  
3.2. Click "Invoke Function" button  
3.3. Set request body (test payload):
     ```json
     {
       "full_name": "Test Dept Head",
       "email": "test-depthead@example.com",
       "password": "testpass123",
       "department_id": "<general-department-uuid>"
     }
     ```
     (Get department UUID from: `SELECT id FROM departments WHERE name = 'General';`)  
3.4. Set Authorization header with admin JWT token (get from first admin after Phase C)  
     Note: This test will fail with 401/403 until first admin exists - acceptable for now  
3.5. Verify function responds (even if 401 Unauthorized - means function is reachable)  
3.6. After first admin created in Phase C, re-test with valid admin token  
3.7. Verify function creates dept head successfully

**Deliverable**: Edge Function reachable and responds (full test deferred to Phase C checkpoint)

---

### ✅ CHECKPOINT A.5: Phase A.5 Complete

**Reviewer must confirm ALL of the following before developer proceeds to Phase B**:

**Evidence Required**:
1. **Screenshot**: Supabase Dashboard > Edge Functions showing `create-dept-head` function with "Active" status
2. **Terminal Output**: `supabase functions list` showing `create-dept-head` deployed
3. **Screenshot**: Supabase Dashboard > Project Settings > Edge Functions > Secrets showing `SUPABASE_SERVICE_ROLE_KEY` set (value hidden)
4. **Test Invocation**: Function responds to test invocation (even if 401 Unauthorized - means function is live)
5. **Code Review**: Reviewer confirms `supabase/functions/create-dept-head/index.ts` implements all required steps from design.md

**Verification Method**: Reviewer invokes function via Dashboard or curl:
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/create-dept-head \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{"full_name":"Test","email":"test@example.com","password":"test123","department_id":"<uuid>"}'

# Expected: 401 Unauthorized (no admin token yet) OR 403 Forbidden (not admin)
# This confirms function is reachable and processing requests
```

**Approval**: Reviewer types "Phase A.5 approved, proceed to Phase B" in response

---

## Phase B: Registration, Login, Protected Routes

**Requirements Traceability**: Req 3, Req 4, Req 5  
**Estimated Time**: 6-8 hours  
**Dependencies**: Phase A.5 complete

### Task B.1: Create AuthContext Provider **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 5.1, Req 5.2, Req 5.3, Req 5.4

1.1. Create file: `src/contexts/AuthContext.jsx`  
1.2. Implement AuthContext with:
     - State: `user`, `profile`, `loading`
     - Session check on mount (`supabase.auth.getSession()`)
     - Auth state listener (`supabase.auth.onAuthStateChange()`)
     - Profile fetch from profiles table after auth
     - `signOut` function
     - Update Zustand `currentUser` with Supabase data  
1.3. Export `AuthProvider` component and `useSupabaseAuth` hook  
1.4. Test context provides correct values

**Deliverable**: `src/contexts/AuthContext.jsx` implemented

---

### Task B.2: Update ProtectedRoute Component **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 5.5, Req 5.6, Req 5.7

2.1. Open existing file: `src/components/auth/ProtectedRoute.jsx`  
2.2. Update to use Supabase auth instead of demo mode:
     - Use `useSupabaseAuth()` hook
     - Check `if (!user)` → redirect to `/login`
     - Check `if (profile.status !== 'approved')` → redirect to `/login` with error
     - Optional: Add `requireRole` prop for role-based guarding  
2.3. Show loading spinner while checking auth  
2.4. Test redirect logic

**Deliverable**: `ProtectedRoute.jsx` updated to use Supabase auth

---

### Task B.3: Create Registration Page **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 3.1-17

3.1. Create file: `src/pages/Register.jsx`  
3.2. Implement registration form with fields:
     - Full Name (text, required)
     - Email (email, required, validated)
     - Password (password, required, min 8 chars)
     - Department (select dropdown, required)  
3.3. Fetch departments from Supabase on mount  
3.4. Handle form submission:
     - Call `supabase.auth.signUp({ email, password })`
     - Create profiles record with role='student', status='pending', department_id  
     - Show success message
     - Redirect to `/login`  
3.5. Handle errors (duplicate email, network error)  
3.6. Add "Already have an account? Log in" link  
3.7. Style consistently with existing app

**Deliverable**: `/register` page functional

---

### Task B.4: Create Login Page **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 4.1-18

4.1. Create file: `src/pages/Login.jsx`  
4.2. Implement login form with fields:
     - Email (email, required)
     - Password (password, required)  
4.3. Handle form submission:
     - Call `supabase.auth.signInWithPassword({ email, password })`
     - Fetch profile from profiles table
     - Check status: pending → error + signOut, disabled → error + signOut
     - Route by role: admin → `/admin`, dept_head → `/dept-head`, student → `/dashboard`  
4.4. Handle errors (invalid credentials)  
4.5. Add "Don't have an account? Register" link  
4.6. Show error from ProtectedRoute if redirected (location.state.error)

**Deliverable**: `/login` page functional

---

### Task B.5: Update App Routes **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 5.8, Req 5.9

5.1. Open `src/App.tsx`  
5.2. Wrap entire app with `<AuthProvider>`  
5.3. Add public routes (outside ProtectedRoute):
     - `/login` → Login page
     - `/register` → Register page  
5.4. Wrap existing training routes with `<ProtectedRoute>`  
5.5. Add protected routes for Phase C/D (empty for now):
     - `/admin` → ProtectedRoute + requireRole="admin" (placeholder)
     - `/dept-head` → ProtectedRoute + requireRole="dept_head" (placeholder)  
5.6. Set `/login` as default route for unauthenticated users  
5.7. Redirect authenticated users away from `/login` and `/register` to their dashboard

**Deliverable**: App routes updated with auth guards

---

### Task B.6: Update Logout Functionality **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 5.11, Req 5.12

6.1. Open `src/hooks/useAuth.js` (or wherever logout is defined)  
6.2. Update `logout` function to:
     - Call `supabase.auth.signOut()`
     - Clear Zustand `currentUser`
     - Redirect to `/login`  
6.3. Test logout clears session and redirects

**Deliverable**: Logout functionality updated

---

### ✅ CHECKPOINT B: Phase B Complete

**Developer must provide ALL of the following evidence to reviewer**:

**Evidence Required**:
1. **Video Recording** (1-2 min): Full registration flow
   - Navigate to `/register`
   - Fill form: name, email, password, select "General" department
   - Submit → See success message
   - Redirect to `/login`
   - Check Supabase Dashboard > Authentication > Users → New user exists
   - Check Supabase Dashboard > Database > profiles table → New profile with status='pending'

2. **Video Recording** (1-2 min): Login flow with pending account
   - Attempt login with registered credentials
   - See error: "Account pending approval"
   - Verify user is logged out (redirected to /login)

3. **Video Recording** (1 min): Protected route redirect
   - While logged out, try to navigate to `/dashboard`
   - Verify redirect to `/login`

4. **Screenshot**: Supabase profiles table showing registered student with status='pending' and department_id=(General UUID)

5. **Code Review**: Reviewer confirms no client-side `signUp()` call attempts to create dept heads (only used for student registration)

**Verification Method**: Reviewer tests registration + login flow themselves

**Approval**: Reviewer types "Phase B approved, proceed to Phase C" in response

---

## Phase C: Admin Dashboard & Dept Head Creation

**Requirements Traceability**: Req 6, Req 9  
**Estimated Time**: 8-10 hours  
**Dependencies**: Phase B complete

### Task C.1: First Admin Account Creation **[REVIEWER ACTION]**

**Owner**: Reviewer  
**Traceability**: Req 9.1-7

**CRITICAL**: This must be done before any Phase C UI can be tested

1.1. Navigate to Supabase Dashboard > Authentication > Users  
1.2. Click "Invite User" or "Add User"  
1.3. Enter:
     - Email: admin@example.com (or reviewer's preferred email)
     - Password: (secure password - reviewer chooses)
     - Auto Confirm User: Yes  
1.4. Note the user ID from created user  
1.5. Navigate to Supabase Dashboard > SQL Editor  
1.6. Run SQL:
     ```sql
     INSERT INTO profiles (id, full_name, role, status)
     VALUES (
       '<user-id-from-step-1.4>',
       'System Administrator',
       'admin',
       'approved'
     );
     ```
1.7. Verify profile created: `SELECT * FROM profiles WHERE role = 'admin';`  
1.8. Test login at application `/login` with admin credentials  
1.9. Verify redirect to `/admin` (will show 404 until UI is built, but route works)

**Deliverable**: First admin account created, can log in successfully

---

### Task C.2: Create Admin Dashboard Page **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 6.1, Req 6.2

2.1. Create file: `src/pages/AdminDashboard.jsx`  
2.2. Implement admin dashboard layout:
     - Header with "ADMIN DASHBOARD" title + logout button
     - Departments section
     - Users section  
2.3. Add route in `App.tsx`:
     ```jsx
     <Route path="/admin" element={
       <ProtectedRoute requireRole="admin">
         <AdminDashboard />
       </ProtectedRoute>
     } />
     ```
2.4. Test admin can access `/admin`, non-admin cannot (403 or redirect)

**Deliverable**: `/admin` page accessible by admin only

---

### Task C.3: Create Department List Component **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 6.3, Req 6.4

3.1. Create file: `src/components/admin/DepartmentCard.jsx`  
3.2. Implement department card showing:
     - Department name
     - Assigned Dept Head (name or "None")
     - Number of students  
3.3. Fetch departments with JOIN to profiles for dept_head_id  
3.4. Count students per department  
3.5. Display in grid layout

**Deliverable**: Department list showing "General" department

---

### Task C.4: Create Department Modal **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 6.10, Req 6.11, Req 6.12, Req 6.13

4.1. Create file: `src/components/admin/CreateDepartmentModal.jsx`  
4.2. Implement form with field: name (text, required, unique)  
4.3. Handle submission:
     - Insert into departments table
     - Refresh department list
     - Close modal  
4.4. Handle errors (duplicate name)  
4.5. Add "+ Create Department" button to Admin Dashboard

**Deliverable**: Admin can create new departments

---

### Task C.5: Create Dept Head Modal **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 6.5-9

5.1. Create file: `src/components/admin/CreateDeptHeadModal.jsx`  
5.2. Implement form with fields:
     - Full Name (text, required)
     - Email (email, required)
     - Password (password, required, min 8 chars)
     - Department (select dropdown, required)  
5.3. Handle submission:
     - Call Edge Function: `supabase.functions.invoke('create-dept-head', { body: {...} })`
     - Show success toast
     - Refresh user list
     - Close modal  
5.4. Handle errors from Edge Function  
5.5. Add "+ Create Dept Head" button to Admin Dashboard

**Deliverable**: Admin can create dept heads via Edge Function

---

### Task C.6: Create User List Component **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 6.14, Req 6.15, Req 6.16

6.1. Create file: `src/components/admin/UserList.jsx`  
6.2. Fetch all profiles with departments (JOIN)  
6.3. Group users by role: Admins, Dept Heads, Students (Pending), Students (Approved)  
6.4. Display each group with:
     - User name, email, department (if applicable)
     - Status badge
     - Action buttons: Approve/Disable based on status  
6.5. Implement status change:
     - UPDATE profiles SET status = 'approved'/'disabled' WHERE id = user_id
     - Refresh list  
6.6. Handle department reassignment (optional, can defer)

**Deliverable**: Admin can view all users and change status

---

### ✅ CHECKPOINT C: Phase C Complete

**Developer must provide ALL of the following evidence to reviewer**:

**Evidence Required**:
1. **Video Recording** (2-3 min): Admin creates Dept Head via Edge Function
   - Login as admin
   - Navigate to `/admin`
   - Click "+ Create Dept Head"
   - Fill form: name, email, password, select "General" department
   - Submit → See success toast
   - Verify user list refreshes showing new dept head
   - Verify admin is STILL logged in as admin (session not hijacked)
   - Check Supabase Dashboard > Authentication > Users → New dept head user exists
   - Check Supabase Dashboard > Database > profiles → New profile with role='dept_head', status='approved'

2. **Video Recording** (1 min): Created Dept Head can log in
   - Logout as admin
   - Login with dept head credentials
   - Verify redirect to `/dept-head` (will show 404 until Phase D, but route works)

3. **Video Recording** (1 min): Admin creates new department
   - Login as admin
   - Click "+ Create Department"
   - Enter name: "Front Desk"
   - Submit → See new department in list

4. **Screenshot**: Supabase profiles table showing admin + dept head profiles

5. **Screenshot**: Supabase departments table showing "General" + newly created department

6. **Edge Function Test**: Reviewer re-invokes Edge Function with admin token, confirms success

**Verification Method**: Reviewer tests Dept Head creation flow themselves with admin account

**Approval**: Reviewer types "Phase C approved, proceed to Phase D" in response

---

## Phase D: Dept Head Dashboard & Student Approval

**Requirements Traceability**: Req 7  
**Estimated Time**: 6-8 hours  
**Dependencies**: Phase C complete

### Task D.1: Create Dept Head Dashboard Page **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 7.1, Req 7.2

1.1. Create file: `src/pages/DeptHeadDashboard.jsx`  
1.2. Implement dept head dashboard layout:
     - Header with "DEPT HEAD DASHBOARD - {Department Name}" + logout button
     - Pending Registrations section
     - Approved Students section  
1.3. Add route in `App.tsx`:
     ```jsx
     <Route path="/dept-head" element={
       <ProtectedRoute requireRole="dept_head">
         <DeptHeadDashboard />
       </ProtectedRoute>
     } />
     ```
1.4. Test dept head can access `/dept-head`, non-dept-head cannot

**Deliverable**: `/dept-head` page accessible by dept heads only

---

### Task D.2: Create Pending Students List **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 7.3, Req 7.4, Req 7.5, Req 7.6

2.1. Create file: `src/components/dept-head/PendingStudentCard.jsx`  
2.2. Fetch students WHERE department_id = (dept head's department) AND status = 'pending'  
2.3. Display each student card with:
     - Full name
     - Email
     - Registration date (created_at)  
2.4. RLS will automatically filter students (dept head can only see their department)  
2.5. Handle empty state: "No pending registrations"

**Deliverable**: Dept head sees pending students in their department

---

### Task D.3: Implement Student Approval **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 7.7, Req 7.8, Req 7.9, Req 7.10

3.1. Add "Approve" button to each pending student card  
3.2. Handle approval:
     - UPDATE profiles SET status = 'approved' WHERE id = student_id
     - RLS will enforce dept head can only approve students in their department
     - Show success toast
     - Refresh student lists  
3.3. Handle errors (RLS denial if trying to approve student from other department)

**Deliverable**: Dept head can approve pending students

---

### Task D.4: Implement Student Rejection **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 7.11, Req 7.12, Req 7.13

4.1. Add "Reject" button to each pending student card  
4.2. Show confirmation dialog: "Are you sure you want to reject this registration?"  
4.3. Handle rejection:
     - UPDATE profiles SET status = 'disabled' WHERE id = student_id
     - Show success toast
     - Refresh student lists  
4.4. Verify rejected student cannot log in (status check in login page)

**Deliverable**: Dept head can reject students

---

### Task D.5: Create Approved Students List **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 7.14, Req 7.15

5.1. Create file: `src/components/dept-head/ApprovedStudentCard.jsx`  
5.2. Fetch students WHERE department_id = (dept head's department) AND status = 'approved'  
5.3. Display each student card with:
     - Full name
     - Email
     - Registration date
     - "Disable" button  
5.4. Handle disable action:
     - UPDATE profiles SET status = 'disabled' WHERE id = student_id
     - Show confirmation dialog
     - Refresh student lists

**Deliverable**: Dept head can view and disable approved students

---

### ✅ CHECKPOINT D: Phase D Complete

**Developer must provide ALL of the following evidence to reviewer**:

**Evidence Required**:
1. **Video Recording** (2-3 min): Complete student approval flow
   - Login as dept head (created in Phase C)
   - Navigate to `/dept-head`
   - See pending student (registered in Phase B) in "Pending Registrations" section
   - Click "Approve" button
   - See success toast
   - Verify student moves to "Approved Students" section
   - Check Supabase profiles table → Student status changed to 'approved'

2. **Video Recording** (1-2 min): Approved student can log in
   - Logout as dept head
   - Login with approved student credentials (from Phase B registration)
   - Verify redirect to `/dashboard` (existing training app)
   - Verify training app loads successfully

3. **Video Recording** (1 min): Dept head can only see own department students
   - Create second department + dept head via Admin (Phase C flow)
   - Register new student in second department
   - Login as first dept head → Verify cannot see second department's student
   - Login as second dept head → Verify can see only second department's student (RLS enforced)

4. **Video Recording** (1 min): Rejection flow
   - Register new student
   - Login as dept head
   - Click "Reject" button
   - Confirm rejection
   - Logout, attempt login with rejected student → See "disabled" error

5. **Screenshot**: Supabase profiles table showing students with different statuses (pending, approved, disabled)

**Verification Method**: Reviewer tests approval flow with their own test accounts

**Approval**: Reviewer types "Phase D approved, proceed to Phase E" in response

---

## Phase E: Integration & Polish

**Requirements Traceability**: Req 8  
**Estimated Time**: 10-12 hours  
**Dependencies**: Phase D complete

### Task E.1: Update useHotelStore.currentUser Structure **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 8.4, Design Section 6 (Phase E)

1.1. Open `src/store/useHotelStore.js`  
1.2. Update `currentUser` initial state structure:
     ```javascript
     // OLD:
     currentUser: { name: "IT ADMIN", role: "manager", username: "admin" }
     
     // NEW:
     currentUser: {
       id: null,
       email: null,
       full_name: null,
       authRole: null,      // Auth hierarchy role (admin/dept_head/student)
       department_id: null,
       status: null,
       username: null       // Keep for backward compat
     }
     ```
1.3. Update `login` action to accept new structure  
1.4. Add `setCurrentUser` action:
     ```javascript
     setCurrentUser: (userData) => set({ currentUser: userData })
     ```
1.5. Verify no breaking changes in store usage

**Deliverable**: useHotelStore updated with new currentUser structure

---

### Task E.2: Update AuthContext to Populate Zustand Store **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 8.4, Design Section 6 (Phase E)

2.1. Open `src/contexts/AuthContext.jsx`  
2.2. Import `useHotelStore` actions  
2.3. Update `fetchProfile` function to call `setCurrentUser`:
     ```javascript
     setCurrentUser({
       id: data.id,
       email: user.email,
       full_name: data.full_name,
       authRole: data.role,           // NOT "role" - use "authRole"
       department_id: data.department_id,
       status: data.status,
       username: user.email.split('@')[0] // Derive for backward compat
     });
     ```
2.4. Update `signOut` to clear currentUser:
     ```javascript
     setCurrentUser(null);
     ```
2.5. Test currentUser populated correctly after login

**Deliverable**: Zustand store populated with Supabase user data

---

### Task E.3: Update CancelBooking.jsx to Use Training Role **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Design Section 6 (Phase E) - currentUser.role collision fix

3.1. Open `src/pages/CancelBooking.jsx`  
3.2. Find line 285: `{currentUser?.role === "hotel_manager" && (`  
3.3. Import `useRoleStore`:
     ```javascript
     import { useRoleStore } from '../store/useRoleStore';
     ```
3.4. Replace check with training role:
     ```javascript
     // OLD:
     {currentUser?.role === "hotel_manager" && (
       <div>Manager Access Badge</div>
     )}
     
     // NEW:
     const currentRole = useRoleStore(state => state.currentRole);
     {currentRole === "hotel_manager" && (
       <div>Manager Access Badge</div>
     )}
     ```
3.5. Test manager badge shows when training role is hotel_manager

**Deliverable**: CancelBooking.jsx uses training role, not auth role

---

### Task E.4: Update TopHeader to Display Supabase User Name **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 8.15, Design Section 6 (Phase E)

4.1. Open `src/components/layout/TopHeader.jsx`  
4.2. Update display to use `currentUser.full_name`:
     ```javascript
     // Line 98: OLD
     {currentUser?.name || "IT ADMIN"}
     
     // NEW
     {currentUser?.full_name || currentUser?.name || "Unknown User"}
     ```
4.3. Test TopHeader shows authenticated student's full name from Supabase

**Deliverable**: TopHeader displays Supabase user's full name

---

### Task E.5: Update Waiter Order Creation **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Design Section 6 (Phase E)

5.1. Open `src/store/useHotelStore.js`, find `submitOrder` action  
5.2. Update waiter name to use full_name:
     ```javascript
     // Line 352: OLD
     waiterName: state.currentUser.name,
     
     // NEW
     waiterName: state.currentUser.full_name || state.currentUser.name || "Unknown",
     ```
5.3. Test F&B order submission includes correct waiter name

**Deliverable**: Waiter orders use Supabase full name

---

### Task E.6: Update Dashboard Display **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Design Section 6 (Phase E)

6.1. Open `src/pages/Dashboard.jsx`  
6.2. Update user display:
     ```javascript
     // Line 90: OLD
     USER: <span className="font-bold text-yellow-300">{currentUser?.name || "IT ADMIN"}</span>
     
     // NEW
     USER: <span className="font-bold text-yellow-300">{currentUser?.full_name || "Unknown User"}</span>
     ```
6.3. Test dashboard shows Supabase user name

**Deliverable**: Dashboard displays Supabase user name

---

### Task E.7: Update RoomDetailSheet Display **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Design Section 6 (Phase E)

7.1. Open `src/components/rooms/RoomDetailSheet.jsx`  
7.2. Update "Last Modified" display:
     ```javascript
     // Line 532: OLD
     LAST MODIFIED: {todayFormatted} 19:52 BY {currentUser?.name || "IT ADMIN"}
     
     // NEW
     LAST MODIFIED: {todayFormatted} 19:52 BY {currentUser?.full_name || "Unknown"}
     ```
7.3. Test room detail sheet shows Supabase user name

**Deliverable**: Room details show Supabase user name

---

### Task E.8: Update WaiterLanding Display **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Design Section 6 (Phase E)

8.1. Open `src/pages/waiter/WaiterLanding.jsx`  
8.2. Update waiter display:
     ```javascript
     // Line 96: OLD
     <span className="text-gray-900">{currentUser?.name || "Unknown"}</span>
     
     // NEW
     <span className="text-gray-900">{currentUser?.full_name || "Unknown"}</span>
     ```
8.3. Test waiter landing shows Supabase user name

**Deliverable**: Waiter landing shows Supabase user name

---

### Task E.9: Test Role Switcher Unchanged **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 8.2, Req 8.3, Req 8.6, Req 8.7, Req 8.8

9.1. Login as approved student  
9.2. Navigate to Settings (or wherever role switcher is located)  
9.3. Test switching between training roles:
     - hotel_manager
     - front_office
     - housekeeping
     - waiter_fnb  
9.4. Verify role switcher works unchanged  
9.5. Verify training role stored in `useRoleStore.currentRole` (separate from authRole)  
9.6. Verify RBAC permissions work correctly (e.g., waiter can access /waiter, front_office can check in guests)

**Deliverable**: Role switcher works unchanged, training roles separate from auth roles

---

### Task E.10: Test Demo Reset Functionality **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 8.11, Req 8.12

10.1. Login as approved student  
10.2. Make changes to training data (create reservation, assign room, etc.)  
10.3. Click "Demo Reset" button (if exists in UI)  
10.4. Verify training data resets to original state  
10.5. Verify user remains logged in (auth session NOT cleared)  
10.6. Verify currentUser still populated with Supabase data

**Deliverable**: Demo reset clears training data, preserves auth session

---

### Task E.11: Test All Existing Features **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Req 8.2, Req 8.16 (comprehensive integration test)

11.1. Login as approved student  
11.2. Test each existing feature:
      - Dashboard: View stats, day-end process
      - Rooms: View rooms, filter, change status, assign rooms
      - Reservations: Quick reservation, guest lookup, amend booking, cancel booking
      - Check-in: Check in guest with reservation
      - Check-out: Check out guest
      - Housekeeping: View housekeeping dashboard, assign tasks
      - F&B Waiter: Take order (all 3 outlets), review order, submit order
      - Reports: View all report types  
11.3. Verify all features work unchanged  
11.4. Verify no errors in console related to currentUser structure  
11.5. Verify localStorage persistence still works for training data

**Deliverable**: All existing training features work with Supabase auth

---

### Task E.12: Remove Demo Mode (Optional) **[DEVELOPER ACTION]**

**Owner**: Developer  
**Traceability**: Design Section 7.2 (Demo Mode Removal)

12.1. Open `src/components/layout/TopHeader.jsx`  
12.2. Remove "Demo Mode" badge (if exists)  
12.3. Remove any demo login/logout buttons not using Supabase  
12.4. Update README.md to document authentication requirement  
12.5. Update README.md with registration instructions

**Deliverable**: Demo mode removed, authentication required

---

### ✅ CHECKPOINT E: Phase E Complete

**Developer must provide ALL of the following evidence to reviewer**:

**Evidence Required**:
1. **Video Recording** (5-7 min): Complete end-to-end flow
   - Register as new student (Show form, submit, verify pending in Supabase)
   - Login as dept head, approve student
   - Login as approved student
   - Verify TopHeader shows student's full name from Supabase
   - Test role switcher: Switch to hotel_manager, front_office, waiter_fnb
   - Test one feature from each category:
     - Rooms: Assign room to guest
     - F&B: Create waiter order
     - Housekeeping: Assign housekeeper to room
     - Reservations: Create quick reservation
   - Verify all features work correctly
   - Verify CancelBooking.jsx manager badge shows when role is hotel_manager

2. **Video Recording** (2 min): Demo reset test
   - Make changes to training data
   - Click demo reset (or equivalent)
   - Verify data resets
   - Verify user remains logged in (not redirected to login)

3. **Video Recording** (1 min): Logout test
   - Click logout button
   - Verify redirect to /login
   - Verify cannot access protected routes without login

4. **Screenshot**: Browser console showing no errors after full feature test

5. **Screenshot**: Supabase profiles table showing mix of roles (admin, dept_head, students with different statuses)

6. **Code Review**: Reviewer confirms:
   - `currentUser.authRole` used (not `role`)
   - `CancelBooking.jsx` uses `useRoleStore.currentRole`
   - All `currentUser.name` references updated to `currentUser.full_name`
   - No remaining demo mode login logic (all using Supabase auth)

**Verification Method**: Reviewer performs comprehensive test with own accounts:
- Register as student
- Approve as dept head
- Login as student and test all major features
- Verify no breaking changes in training app

**Approval**: Reviewer types "Phase E approved, feature complete" in response

---

## Final Approval Gate

**BEFORE MARKING FEATURE COMPLETE, REVIEWER MUST CONFIRM**:

### Functional Requirements
- [ ] Students can self-register with department selection
- [ ] Registration creates pending account (cannot login)
- [ ] Dept heads can approve pending students in their department
- [ ] Approved students can login and access training app
- [ ] Admin can create dept heads via Edge Function
- [ ] Admin can create departments
- [ ] Admin can manage all users (view, approve, disable)
- [ ] RLS correctly isolates data by department
- [ ] Role switcher works unchanged (training roles separate from auth roles)
- [ ] All existing training features work with Supabase auth

### Security Requirements
- [ ] Service role key never exposed in client code
- [ ] RLS policies enforce access control at database level
- [ ] Edge Function validates admin role before creating dept heads
- [ ] Passwords hashed by Supabase (never visible)
- [ ] Session tokens expire after inactivity
- [ ] Environment variables gitignored

### Integration Requirements
- [ ] currentUser structure updated without breaking existing code
- [ ] CancelBooking.jsx uses training role (not auth role)
- [ ] All displays show Supabase user's full name
- [ ] Demo reset works (training data reset, auth preserved)
- [ ] Logout works (Supabase signOut + redirect)

### Testing Evidence
- [ ] Video evidence provided for all 5 phases (B, C, D, E checkpoints)
- [ ] Screenshots show Supabase tables populated correctly
- [ ] No console errors during comprehensive feature test
- [ ] Reviewer successfully tested with own accounts

---

## Post-Implementation Tasks (Future Enhancements)

**NOT REQUIRED FOR PHASE A-E COMPLETION**:

### Priority 1 (Near-term)
- [ ] Password reset flow (Supabase magic link)
- [ ] Email notifications on approval (Supabase email templates)
- [ ] Profile editing (students update own full name)
- [ ] Dept head reassignment (admin changes dept head for department)

### Priority 2 (Medium-term)
- [ ] Email verification on registration (Supabase email confirmation)
- [ ] Admin audit log (track who approved/disabled which students)
- [ ] Bulk student import (CSV upload for mass registration)
- [ ] Department reassignment (admin moves students between departments)

### Priority 3 (Long-term)
- [ ] Two-factor authentication (Supabase 2FA)
- [ ] OAuth login (Google, Microsoft) via Supabase
- [ ] Profile pictures (Supabase Storage)
- [ ] Advanced analytics (student usage tracking)

---

## Task Summary

**Total Tasks**: 46 tasks across 6 phases  
**Estimated Total Time**: 35-45 hours

### Phase Breakdown
- **Phase A**: 6 tasks, 2-3 hours (Backend setup)
- **Phase A.5**: 3 tasks, 2-3 hours (Edge Function deployment)
- **Phase B**: 6 tasks, 6-8 hours (Registration + Login)
- **Phase C**: 6 tasks, 8-10 hours (Admin Dashboard)
- **Phase D**: 5 tasks, 6-8 hours (Dept Head Dashboard)
- **Phase E**: 12 tasks, 10-12 hours (Integration + Polish)
- **Total**: 38 implementation tasks + 6 checkpoints + 1 final approval gate

### Reviewer Actions Required
1. Phase A: Create Supabase project, execute SQL
2. Phase A.5: Deploy Edge Function, set secrets
3. Phase C: Create first admin account
4. All Phases: Review evidence at checkpoints, approve before next phase

### Developer Actions Required
- All code implementation tasks
- All testing and evidence gathering
- All component/page creation
- All integration work

---

**Tasks Document Version**: 1.0  
**Date**: 2026-08-12  
**Status**: ✅ **AWAITING REVIEWER APPROVAL TO BEGIN IMPLEMENTATION**  
**Next Step**: Reviewer approves tasks.md → Developer begins Phase A

---

## Approval

**Reviewer**: ___________________  
**Date**: ___________________  
**Signature**: Approved to proceed with Phase A implementation

**Developer SHALL NOT write any code until reviewer signs above approval**
