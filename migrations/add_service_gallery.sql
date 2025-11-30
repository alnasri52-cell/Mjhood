-- Migration: Add gallery_urls to service_categories table
-- This allows each service to have its own image gallery

ALTER TABLE service_categories
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[];

-- Add comment
COMMENT ON COLUMN service_categories.gallery_urls IS 'Array of image URLs specific to this service';
