-- Add city and neighborhood columns for reverse geocoding
-- Run this in Supabase SQL Editor

ALTER TABLE local_needs ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE local_needs ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Create index for city-based queries
CREATE INDEX IF NOT EXISTS idx_local_needs_city ON local_needs(city);
CREATE INDEX IF NOT EXISTS idx_local_needs_neighborhood ON local_needs(neighborhood);

-- Verify
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'local_needs' AND column_name IN ('city', 'neighborhood');
