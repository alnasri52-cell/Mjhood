-- Migration: Ensure public read access for all Map tables
-- This script ensures that 'anon' and 'authenticated' users can SELECT from these tables
-- Run this in your Supabase SQL Editor to fix any "missing permissions" issues

-- 1. Service Categories
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active service categories" ON service_categories;
DROP POLICY IF EXISTS "Anyone can view active service categories" ON service_categories;

CREATE POLICY "Public can view active service categories"
    ON service_categories FOR SELECT
    TO public
    USING (deleted_at IS NULL);

-- 2. CVS
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active cvs" ON cvs;
DROP POLICY IF EXISTS "Anyone can view active cvs" ON cvs;

CREATE POLICY "Public can view active cvs"
    ON cvs FOR SELECT
    TO public
    USING (deleted_at IS NULL);

-- 3. Resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active resources" ON resources;
DROP POLICY IF EXISTS "Anyone can view active resources" ON resources;

CREATE POLICY "Public can view active resources"
    ON resources FOR SELECT
    TO public
    USING (deleted_at IS NULL);

-- 4. Local Needs
ALTER TABLE local_needs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active local needs" ON local_needs;
DROP POLICY IF EXISTS "Anyone can view active local needs" ON local_needs;

CREATE POLICY "Public can view active local needs"
    ON local_needs FOR SELECT
    TO public
    USING (deleted_at IS NULL);

-- 5. Profiles (Re-apply just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT 
    USING (true);

-- Grant explicit permissions (sometimes needed for role inheritance)
GRANT SELECT ON service_categories TO anon, authenticated;
GRANT SELECT ON cvs TO anon, authenticated;
GRANT SELECT ON resources TO anon, authenticated;
GRANT SELECT ON local_needs TO anon, authenticated;
GRANT SELECT ON profiles TO anon, authenticated;
