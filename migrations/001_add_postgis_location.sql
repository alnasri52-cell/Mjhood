-- Migration 001: Add PostGIS geography column for spatial queries
-- Run in Supabase SQL Editor

-- 1. Enable PostGIS extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add geography column to local_needs
ALTER TABLE local_needs
ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- 3. Backfill existing rows from latitude/longitude
UPDATE local_needs
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

-- 4. Create spatial index for fast radius/proximity queries
CREATE INDEX IF NOT EXISTS idx_local_needs_location ON local_needs USING GIST (location);

-- 5. Trigger to auto-populate location from lat/lng on INSERT/UPDATE
-- This keeps the location column always in sync without frontend changes
CREATE OR REPLACE FUNCTION sync_local_needs_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_location ON local_needs;
CREATE TRIGGER trg_sync_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON local_needs
FOR EACH ROW EXECUTE FUNCTION sync_local_needs_location();
