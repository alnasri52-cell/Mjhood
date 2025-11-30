-- Fix foreign key relationship for local_needs -> profiles
-- Drop the existing constraint if it exists
ALTER TABLE local_needs DROP CONSTRAINT IF EXISTS local_needs_user_id_fkey;

-- Add the foreign key constraint with explicit naming
ALTER TABLE local_needs 
ADD CONSTRAINT local_needs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Refresh the schema cache (this happens automatically after DDL changes)
