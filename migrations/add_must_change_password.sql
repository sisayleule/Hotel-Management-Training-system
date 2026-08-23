-- ============================================================================
-- ADD must_change_password TO profiles
-- Run this in Supabase SQL Editor
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- Index for fast lookup on login gate check
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password
  ON profiles(must_change_password)
  WHERE must_change_password = true;

-- ============================================================================
-- DONE
-- After running, redeploy the reset-student-password edge function so it
-- can set this flag to true when a dept head resets a student password.
-- ============================================================================
