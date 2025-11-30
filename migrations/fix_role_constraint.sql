-- Fix role constraint to support both old and new role names
-- This allows: user, client, talent, admin, moderator

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with all roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'client', 'talent', 'admin', 'moderator'));
