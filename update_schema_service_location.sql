-- Add latitude and longitude columns to the services table
ALTER TABLE services
ADD COLUMN latitude float8,
ADD COLUMN longitude float8;

-- Optional: Add a comment to explain these columns
COMMENT ON COLUMN services.latitude IS 'Latitude of the service location';
COMMENT ON COLUMN services.longitude IS 'Longitude of the service location';
