-- Migration: Add user_id to local_needs table
-- This allows tracking which user created each need

-- Add user_id column
ALTER TABLE local_needs 
ADD COLUMN user_id UUID REFERENCES profiles(id);

-- Create index for performance
CREATE INDEX idx_local_needs_user_id ON local_needs(user_id);

-- Update RLS policies
-- Drop old policy that allowed anyone to insert
DROP POLICY IF EXISTS "Anyone can insert local needs" ON local_needs;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can insert needs"
ON local_needs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Note: Existing needs will have NULL user_id (legacy data)
-- This is intentional to preserve historical data
