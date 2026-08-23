-- ============================================================================
-- ADD 'rejected' TO user_status ENUM
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add 'rejected' value to the existing user_status enum
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'rejected';

-- Step 2: Verify the enum now includes 'rejected'
SELECT 
  enumlabel AS status_value
FROM pg_enum
WHERE enumtypid = 'user_status'::regtype
ORDER BY enumsortorder;

-- Expected result should show:
-- pending
-- approved
-- rejected  ← New value
-- disabled

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The user_status enum now supports all four states:
-- - pending: Initial state after registration
-- - approved: Approved by department head
-- - rejected: Rejected by department head
-- - disabled: Disabled by admin/dept head (future use)
-- ============================================================================
