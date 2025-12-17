-- Add category column to cvs table
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS category TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN cvs.category IS 'Major professional category (e.g. Engineering, Healthcare) from CV_CATEGORIES';

-- Update RLS if necessary (usually column additions don't break RLS unless specific column security is used)
-- The existing policies allow INSERT/UPDATE based on user_id, which handles the new column automatically.
