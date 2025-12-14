-- Migration: Ensure profiles are publicly viewable
-- This is critical for the main map to fetch service locations associated with profiles

-- Enable RLS (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create policy allowing everyone (anon included) to read profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Ensure service_categories is also explicitly open (redundant but safe)
DROP POLICY IF EXISTS "Anyone can view active service categories" ON service_categories;
CREATE POLICY "Anyone can view active service categories"
    ON service_categories FOR SELECT
    USING (deleted_at IS NULL);
