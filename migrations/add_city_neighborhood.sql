-- Add city and neighborhood columns to local_needs
-- Run this in Supabase SQL Editor

ALTER TABLE local_needs
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Index for filtering by city
CREATE INDEX IF NOT EXISTS idx_local_needs_city ON local_needs(city);
