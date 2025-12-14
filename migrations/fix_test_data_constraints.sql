-- Fix relationships for test data handling
-- Problem: Test data uses fake user_ids which don't exist in auth.users, so we dropped FKs.
-- Result: PostgREST cannot find relationships for 'profiles:user_id' joins.
-- Solution: Point FKs to profiles(id) instead of auth.users(id), as profiles table HAS the fake IDs.

-- 1. CVs Table
-- Add FK to profiles (if it doesn't exist, we dropped the one to auth.users)
-- We need to ensure we don't have conflicting constraints.
ALTER TABLE cvs DROP CONSTRAINT IF EXISTS cvs_user_id_fkey; -- ensure dropped
ALTER TABLE cvs ADD CONSTRAINT cvs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Resources Table
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_user_id_fkey;
ALTER TABLE resources ADD CONSTRAINT resources_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Validation
-- This works because 'profiles' table was seeded with these fake IDs in the previous step.
-- And 'cvs' and 'resources' use the same fake IDs.
