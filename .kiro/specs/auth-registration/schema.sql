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
-- STEP 1: Create ENUM types (skip if already exist)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'dept_head', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'banned', 'deleted', 'disabled');
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
  email TEXT, -- Store email for easy access (synced from auth.users)
  role user_role NOT NULL DEFAULT 'student',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status user_status NOT NULL DEFAULT 'pending',
  approval_reason TEXT, -- Reason provided when approving a student
  rejected_reason TEXT, -- Reason provided when rejecting a student
  banned_reason TEXT, -- Reason provided when banning a student
  unban_reason TEXT, -- Reason provided when unbanning a student (history preserved)
  email_notifications BOOLEAN DEFAULT true, -- Email notifications for dept heads on new registrations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_dept_head_has_department 
    CHECK (role != 'dept_head' OR department_id IS NOT NULL),
  CONSTRAINT check_admin_no_department
    CHECK (role != 'admin' OR department_id IS NOT NULL)
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

-- Dept Heads can update their own profile (name and email_notifications)
DROP POLICY IF EXISTS "Dept Heads can update own profile" ON profiles;
CREATE POLICY "Dept Heads can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id AND get_my_role() = 'dept_head')
  WITH CHECK (
    auth.uid() = id
    AND role = 'dept_head' -- Cannot change role
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
-- STEP 12: Create approval_log table (idempotent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'banned', 'deleted', 'disabled', 'unbanned')),
  reason TEXT,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 13: Create indexes for approval_log (idempotent)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_approval_log_student ON approval_log(student_id);
CREATE INDEX IF NOT EXISTS idx_approval_log_actor ON approval_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_approval_log_created ON approval_log(created_at DESC);

-- ============================================================================
-- STEP 14: Enable RLS on approval_log
-- ============================================================================

ALTER TABLE approval_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 15: Create RLS policies for approval_log (idempotent)
-- ============================================================================

-- Dept heads can view logs for students in their department
DROP POLICY IF EXISTS "Dept heads can view approval logs" ON approval_log;
CREATE POLICY "Dept heads can view approval logs"
  ON approval_log FOR SELECT
  USING (
    get_my_role() = 'dept_head'
    AND student_id IN (
      SELECT id FROM profiles 
      WHERE department_id = get_my_department() 
      AND role = 'student'
    )
  );

-- Dept heads can insert logs for students in their department
DROP POLICY IF EXISTS "Dept heads can insert approval logs" ON approval_log;
CREATE POLICY "Dept heads can insert approval logs"
  ON approval_log FOR INSERT
  WITH CHECK (
    get_my_role() = 'dept_head'
    AND actor_id = auth.uid()
    AND student_id IN (
      SELECT id FROM profiles 
      WHERE department_id = get_my_department() 
      AND role = 'student'
    )
  );

-- Admins can view all logs
DROP POLICY IF EXISTS "Admins can view all approval logs" ON approval_log;
CREATE POLICY "Admins can view all approval logs"
  ON approval_log FOR SELECT
  USING (get_my_role() = 'admin');

-- Admins can insert logs
DROP POLICY IF EXISTS "Admins can insert approval logs" ON approval_log;
CREATE POLICY "Admins can insert approval logs"
  ON approval_log FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Verify tables exist: SELECT * FROM profiles; SELECT * FROM departments; SELECT * FROM approval_log;
-- Verify seed data: SELECT * FROM departments WHERE name = 'General';
-- Verify RLS enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('profiles', 'departments', 'approval_log');
-- Verify FK constraint: SELECT conname FROM pg_constraint WHERE conname = 'fk_departments_dept_head';
-- ============================================================================
