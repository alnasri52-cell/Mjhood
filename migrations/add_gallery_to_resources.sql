-- Migration: Add gallery_urls column to resources table
-- This allows users to upload images for their resources

ALTER TABLE resources ADD COLUMN IF NOT EXISTS gallery_urls TEXT[];
