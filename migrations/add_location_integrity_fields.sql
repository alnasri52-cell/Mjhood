-- Migration: Add location integrity fields to profiles table
-- Adds fields for verification, flagging, and exact coordinate storage

-- Add new columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS location_flags INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS location_flagged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS location_exact_lat FLOAT,
ADD COLUMN IF NOT EXISTS location_exact_lng FLOAT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.location_verified IS 'Whether location has been verified by admin';
COMMENT ON COLUMN profiles.location_flags IS 'Number of location integrity reports';
COMMENT ON COLUMN profiles.location_flagged_at IS 'Timestamp when location was auto-flagged';
COMMENT ON COLUMN profiles.location_exact_lat IS 'Exact latitude (admin only, not displayed on public map)';
COMMENT ON COLUMN profiles.location_exact_lng IS 'Exact longitude (admin only, not displayed on public map)';
COMMENT ON COLUMN profiles.latitude IS 'Public latitude (may be jittered for privacy protection)';
COMMENT ON COLUMN profiles.longitude IS 'Public longitude (may be jittered for privacy protection)';

-- Create index for flagged accounts (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_profiles_flagged 
    ON profiles(location_flagged_at DESC) 
    WHERE location_flags > 0;

-- Create index for verified locations
CREATE INDEX IF NOT EXISTS idx_profiles_verified 
    ON profiles(location_verified) 
    WHERE location_verified = TRUE;

-- Migration: Copy existing coordinates to exact coordinates
-- This preserves the original data before we start applying jitter
UPDATE profiles
SET 
    location_exact_lat = latitude,
    location_exact_lng = longitude
WHERE 
    latitude IS NOT NULL 
    AND longitude IS NOT NULL
    AND location_exact_lat IS NULL;
