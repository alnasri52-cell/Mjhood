-- Migration: Add location fields to service_categories table
-- This allows each service to have its own location

ALTER TABLE service_categories
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_service_categories_location 
    ON service_categories(latitude, longitude) 
    WHERE deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments
COMMENT ON COLUMN service_categories.latitude IS 'Service location latitude';
COMMENT ON COLUMN service_categories.longitude IS 'Service location longitude';
