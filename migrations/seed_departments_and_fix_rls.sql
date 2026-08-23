-- ============================================================
-- Seed departments table + fix RLS so registration form can
-- read departments without being authenticated
-- ============================================================

-- 1. Ensure departments table has at least one row
-- (Insert defaults only if table is empty)
INSERT INTO departments (name)
SELECT unnest(ARRAY[
  'Tourism & Hotel Management',
  'Business Administration',
  'Computer Science',
  'General'
])
WHERE NOT EXISTS (SELECT 1 FROM departments LIMIT 1);

-- 2. Allow public (unauthenticated) SELECT on departments so the
--    registration form can load the department list.
--    This is safe — department names are not sensitive data.
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_public_read" ON departments;
CREATE POLICY "departments_public_read"
  ON departments
  FOR SELECT
  USING (true);

-- 3. Show what's in departments now
SELECT id, name FROM departments ORDER BY name;
