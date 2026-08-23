-- Add university_id column to profiles table (idempotent - safe to run multiple times)
-- Format: UGR/12345/16 (UGR + slash + 5 digits + slash + 2 digits)

-- Step 1: Add column (IF NOT EXISTS prevents error on re-run)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS university_id TEXT;

-- Step 2: Add unique constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_university_id_unique'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_university_id_unique UNIQUE (university_id);
  END IF;
END$$;

-- Step 3: Add format check constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_university_id_format'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_university_id_format
      CHECK (
        university_id IS NULL
        OR university_id ~ '^UGR/[0-9]{5}/[0-9]{2}$'
      );
  END IF;
END$$;

-- Step 4: Index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON profiles(university_id);

-- Step 5: Comment
COMMENT ON COLUMN profiles.university_id IS
  'University ID for student accounts. Format: UGR/DDDDD/DD (e.g. UGR/12345/16). '
  'Used as the student-facing login credential instead of email. '
  'Supabase Auth email is auto-generated as <ugr-id-normalised>@students.internal and never shown to students.';
