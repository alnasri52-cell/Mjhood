-- Add deleted_at column to local_needs table
ALTER TABLE local_needs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at column to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for performance on deleted_at
CREATE INDEX IF NOT EXISTS idx_local_needs_deleted_at ON local_needs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON services(deleted_at);
