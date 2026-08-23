-- ============================================================================
-- APPROVAL LOG TABLE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create extension (if not already exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create approval_log table
-- Columns derived from ApplicantsSection.jsx INSERT calls (handleApprove / handleReject):
--   student_id  → student.id       (UUID FK → profiles)
--   action      → 'approved' | 'rejected'
--   reason      → the typed reason string
--   actor_id    → profile.id       (UUID FK → profiles, the dept head taking action)
--   created_at  → auto-set on insert (used for ordering in RLS policies)

CREATE TABLE IF NOT EXISTS approval_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  reason      TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_log_student ON approval_log(student_id);
CREATE INDEX IF NOT EXISTS idx_approval_log_actor   ON approval_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_approval_log_created ON approval_log(created_at DESC);

-- Step 4: Enable Row Level Security
ALTER TABLE approval_log ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies

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

-- Dept heads can insert logs when taking action
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

-- Step 6: Verify table created successfully
SELECT
  'Table created successfully' AS status,
  COUNT(*) AS row_count
FROM approval_log;

-- Step 7: Verify RLS enabled
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'approval_log';

-- Step 8: Verify indexes created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'approval_log'
ORDER BY indexname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Expected output from Step 6: status = 'Table created successfully', row_count = 0
-- Expected output from Step 7: tablename = 'approval_log', rls_enabled = true
-- Expected output from Step 8: 3 indexes (student, actor, created_at)
-- ============================================================================
