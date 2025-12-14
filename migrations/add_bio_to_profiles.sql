-- Add bio column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN profiles.bio IS 'User biography or about me text';
