-- Add student_id column to profiles table
-- This allows students to register with their university student ID

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);

-- Add comment
COMMENT ON COLUMN profiles.student_id IS 'University student ID number for student accounts';
