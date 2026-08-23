-- ============================================================================
-- ADD REASON COLUMNS TO PROFILES TABLE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add reason columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS approval_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

-- Step 2: Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('approval_reason', 'rejected_reason')
ORDER BY column_name;

-- Step 3: Verify RLS policy allows dept heads to update these fields
-- The existing "Dept Heads can update department profiles" policy should
-- already allow updates to all columns for students in their department

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The profiles table now has:
-- - approval_reason TEXT (nullable) - Stores reason when approving
-- - rejected_reason TEXT (nullable) - Stores reason when rejecting
--
-- These will be populated by the ApplicantsSection component when
-- department heads approve or reject students.
-- ============================================================================
