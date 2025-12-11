-- Migration: Create resources table for idle assets/space listing
-- This allows users to list items/spaces available for rent or borrowing

CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    
    -- Resource-specific fields
    availability_type TEXT CHECK (availability_type IN ('rent', 'borrow', 'both')) DEFAULT 'both',
    price_type TEXT CHECK (price_type IN ('fixed', 'range', 'negotiable', 'free')) DEFAULT 'free',
    price_min NUMERIC,
    price_max NUMERIC,
    price_currency TEXT DEFAULT 'SAR',
    
    -- Contact info
    contact_phone TEXT,
    contact_method TEXT CHECK (contact_method IN ('phone', 'message', 'both')) DEFAULT 'message',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active (non-deleted) resources
CREATE POLICY "Anyone can view active resources"
    ON resources FOR SELECT
    USING (deleted_at IS NULL);

-- Policy: Authenticated users can insert resources
CREATE POLICY "Authenticated users can insert resources"
    ON resources FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own resources
CREATE POLICY "Users can update own resources"
    ON resources FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete (soft delete) their own resources
CREATE POLICY "Users can delete own resources"
    ON resources FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_resources_user_active 
    ON resources(user_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_resources_category 
    ON resources(category) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_resources_location 
    ON resources(latitude, longitude) 
    WHERE deleted_at IS NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_resources_updated_at();

-- Add comments for documentation
COMMENT ON TABLE resources IS 'Stores idle assets and spaces available for rent or borrowing';
COMMENT ON COLUMN resources.user_id IS 'References the user who owns/lists the resource';
COMMENT ON COLUMN resources.availability_type IS 'Whether resource is for rent, borrow, or both';
COMMENT ON COLUMN resources.price_type IS 'Pricing model: fixed, range, negotiable, or free';
COMMENT ON COLUMN resources.deleted_at IS 'Soft delete timestamp - NULL means active';
