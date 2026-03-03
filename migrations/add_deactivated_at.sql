-- Add deactivated_at column to profiles for soft account deletion
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deactivated_at timestamptz DEFAULT NULL;
