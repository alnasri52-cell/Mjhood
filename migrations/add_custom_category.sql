-- Add custom_category column to local_needs
-- Run this in Supabase SQL Editor

ALTER TABLE local_needs
ADD COLUMN IF NOT EXISTS custom_category TEXT;

COMMENT ON COLUMN local_needs.custom_category IS 'User-provided category name when category is Other';
