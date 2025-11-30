-- Migration: Create service_categories table for one-to-many service linking
-- This allows one user location to have multiple service categories

CREATE TABLE IF NOT EXISTS service_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price_type TEXT CHECK (price_type IN ('fixed', 'range', 'negotiable')),
    price_min NUMERIC,
    price_max NUMERIC,
    price_currency TEXT DEFAULT 'SAR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Prevent duplicate categories per user (soft delete aware)
    CONSTRAINT unique_user_category UNIQUE NULLS NOT DISTINCT (user_id, category, deleted_at)
);

-- Enable Row Level Security
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active (non-deleted) service categories
CREATE POLICY "Anyone can view active service categories"
    ON service_categories FOR SELECT
    USING (deleted_at IS NULL);

-- Policy: Users can insert their own service categories
CREATE POLICY "Users can insert own service categories"
    ON service_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own service categories
CREATE POLICY "Users can update own service categories"
    ON service_categories FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete (soft delete) their own service categories
CREATE POLICY "Users can delete own service categories"
    ON service_categories FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_service_categories_user_active 
    ON service_categories(user_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_service_categories_category 
    ON service_categories(category) 
    WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE service_categories IS 'Stores multiple service categories per user, linked to single profile location';
COMMENT ON COLUMN service_categories.user_id IS 'References the user profile - all categories share the profile location';
COMMENT ON COLUMN service_categories.deleted_at IS 'Soft delete timestamp - NULL means active';
