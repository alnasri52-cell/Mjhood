-- Add country column to profiles table
-- This allows users to select their country during registration
-- and enables the map to center on their country by default

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'SA';

COMMENT ON COLUMN profiles.country IS 'ISO 3166-1 alpha-2 country code (e.g., SA, AE, US)';

-- Create index for faster country-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
