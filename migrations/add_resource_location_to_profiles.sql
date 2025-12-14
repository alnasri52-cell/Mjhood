-- Migration: Add resource location fields to profiles table
-- This stores the single resource location per user, distinct from service location

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS resource_location_lat NUMERIC,
ADD COLUMN IF NOT EXISTS resource_location_lng NUMERIC;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_resource_location 
    ON profiles(resource_location_lat, resource_location_lng) 
    WHERE resource_location_lat IS NOT NULL AND resource_location_lng IS NOT NULL;

-- Add comments
COMMENT ON COLUMN profiles.resource_location_lat IS 'User resource location latitude - all resources share this location';
COMMENT ON COLUMN profiles.resource_location_lng IS 'User resource location longitude - all resources share this location';
