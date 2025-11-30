-- Add new columns for enhanced profile information
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS gallery_urls text[] DEFAULT ARRAY[]::text[];

-- Comment on columns for clarity
COMMENT ON COLUMN profiles.phone IS 'Contact phone number for the user';
COMMENT ON COLUMN profiles.contact_email IS 'Publicly visible email address';
COMMENT ON COLUMN profiles.social_links IS 'JSON object storing social media links (e.g., instagram, twitter)';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to the user profile picture';
COMMENT ON COLUMN profiles.gallery_urls IS 'Array of URLs for portfolio or gallery images';
