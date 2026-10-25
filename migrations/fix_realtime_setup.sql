-- ============================================================================
-- Fix Realtime and WebSocket Connection Issues
-- ============================================================================
-- Run this in Supabase SQL Editor to resolve WebSocket connection errors
-- Date: August 14, 2026

-- Step 1: Ensure student_id column exists
-- This fixes the "column does not exist" error
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
COMMENT ON COLUMN profiles.student_id IS 'University student ID number for student accounts';

-- Step 2: Enable Realtime on profiles table (optional)
-- This fixes WebSocket connection errors if you want realtime updates
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Step 3: Grant necessary permissions for realtime
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON approval_log TO authenticated;

-- Step 4: Verify RLS policies allow department heads to see their students
-- This ensures the query can actually return data

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "dept_heads_view_department_students" ON profiles;

CREATE POLICY "dept_heads_view_department_students"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Allow users to view their own profile
  auth.uid() = id
  OR
  -- Allow dept heads to view students in their department
  (
    EXISTS (
      SELECT 1 FROM profiles dept_head
      WHERE dept_head.id = auth.uid()
      AND dept_head.auth_role = 'dept_head'
      AND profiles.department_id = dept_head.department_id
      AND profiles.role = 'student'
    )
  )
);

-- Step 5: Verify approval_log policies
DROP POLICY IF EXISTS "dept_heads_view_approval_logs" ON approval_log;

CREATE POLICY "dept_heads_view_approval_logs"
ON approval_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles dept_head
    WHERE dept_head.id = auth.uid()
    AND dept_head.auth_role = 'dept_head'
    AND student_id IN (
      SELECT id FROM profiles students
      WHERE students.department_id = dept_head.department_id
      AND students.role = 'student'
    )
  )
);

DROP POLICY IF EXISTS "dept_heads_insert_approval_logs" ON approval_log;

CREATE POLICY "dept_heads_insert_approval_logs"
ON approval_log
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles dept_head
    WHERE dept_head.id = auth.uid()
    AND dept_head.auth_role = 'dept_head'
    AND student_id IN (
      SELECT id FROM profiles students
      WHERE students.department_id = dept_head.department_id
      AND students.role = 'student'
    )
  )
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Run these to verify the setup is correct:

-- 1. Check if student_id column exists
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'student_id';

-- 2. Check if realtime is enabled for profiles
SELECT schemaname, tablename, pubname
FROM pg_publication_tables
WHERE tablename = 'profiles';

-- 3. List all policies on profiles table
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 4. List all policies on approval_log table
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'approval_log';

-- ============================================================================
-- Optional: Disable Realtime if you don't need it
-- ============================================================================
-- Uncomment and run this if you want to disable realtime to stop WebSocket errors:

-- ALTER PUBLICATION supabase_realtime DROP TABLE profiles;
