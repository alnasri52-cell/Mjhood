-- Add permissions column to profiles table for moderator access control
-- Admins have full access by default (permissions column ignored)
-- Moderators only have access to sections in their permissions array

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_profiles_permissions ON profiles USING GIN(permissions);

-- Comment for clarity
COMMENT ON COLUMN profiles.permissions IS 'Array of permission strings for moderators. Available: users, services, needs, trust, trash. Admins have full access regardless of this field.';

-- Example: Update a moderator to have specific permissions
-- UPDATE profiles SET permissions = ARRAY['users', 'trust'] WHERE id = 'user-id-here';
