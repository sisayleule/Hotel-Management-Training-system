-- ============================================================================
-- MIGRATION: Add 'password_reset' to approval_log action check constraint
-- Run this in the Supabase SQL Editor BEFORE deploying the updated edge function.
-- ============================================================================

-- The approval_log.action column uses a CHECK constraint (not a Postgres enum),
-- so we drop the old constraint and add a new one that includes 'password_reset'.

ALTER TABLE approval_log
  DROP CONSTRAINT IF EXISTS approval_log_action_check;

ALTER TABLE approval_log
  ADD CONSTRAINT approval_log_action_check
    CHECK (action IN (
      'approved',
      'rejected',
      'disabled',
      'banned',
      'unbanned',
      'deleted',
      'password_reset'
    ));

-- Verify
SELECT
  conname        AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'approval_log'::regclass
  AND contype  = 'c'
  AND conname  = 'approval_log_action_check';
-- ============================================================================
