-- ============================================================================
-- ADD 'banned' AND 'deleted' TO user_status ENUM
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add 'banned' and 'deleted' values to user_status enum
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'banned';
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'deleted';

-- Step 2: Add banned_reason column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- Step 3: Update approval_log action constraint to include new actions
-- Drop the old constraint
ALTER TABLE approval_log 
DROP CONSTRAINT IF EXISTS approval_log_action_check;

-- Add new constraint with all actions
ALTER TABLE approval_log 
ADD CONSTRAINT approval_log_action_check 
CHECK (action IN ('approved', 'rejected', 'banned', 'deleted', 'disabled'));

-- Step 4: Verify changes
-- Check enum values
SELECT enumlabel AS status_value
FROM pg_enum
WHERE enumtypid = 'user_status'::regtype
ORDER BY enumsortorder;

-- Check banned_reason column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'banned_reason';

-- Check approval_log constraint
SELECT conname, pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conname = 'approval_log_action_check';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- user_status enum now has: pending, approved, rejected, banned, deleted, disabled
-- profiles table now has: banned_reason column
-- approval_log now accepts: approved, rejected, banned, deleted, disabled actions
-- ============================================================================
