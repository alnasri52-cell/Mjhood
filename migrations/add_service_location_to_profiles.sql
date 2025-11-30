-- Migration: Add service location fields to profiles table
-- This stores the single service location per user

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS service_location_lat NUMERIC,
ADD COLUMN IF NOT EXISTS service_location_lng NUMERIC;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_service_location 
    ON profiles(service_location_lat, service_location_lng) 
    WHERE service_location_lat IS NOT NULL AND service_location_lng IS NOT NULL;

-- Add comments
COMMENT ON COLUMN profiles.service_location_lat IS 'User service location latitude - all services share this location';
COMMENT ON COLUMN profiles.service_location_lng IS 'User service location longitude - all services share this location';
