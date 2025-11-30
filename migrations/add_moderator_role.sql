-- Add 'moderator' to the allowed roles in profiles table
-- This migration updates the check constraint to allow 'admin', 'moderator', and 'user' roles

-- Step 1: Drop the existing constraint FIRST (so we can update data)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Update any NULL or invalid roles to 'user' (default)
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL OR role NOT IN ('user', 'admin', 'moderator');

-- Step 3: Add new constraint with moderator included
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'moderator'));
