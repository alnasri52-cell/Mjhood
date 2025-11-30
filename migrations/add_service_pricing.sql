-- Add pricing columns to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS price_type VARCHAR(20) CHECK (price_type IN ('fixed', 'range', 'negotiable')),
ADD COLUMN IF NOT EXISTS price_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_currency VARCHAR(3) DEFAULT 'SAR';

-- Add constraint to ensure price_max > price_min for range pricing
ALTER TABLE services
ADD CONSTRAINT price_range_valid CHECK (
    price_type != 'range' OR (price_max IS NOT NULL AND price_max >= price_min)
);

-- Add index for price queries
CREATE INDEX IF NOT EXISTS idx_services_price_type ON services(price_type);
