-- Create services table
CREATE TABLE services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone." ON services
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own services." ON services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services." ON services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services." ON services
    FOR DELETE USING (auth.uid() = user_id);

-- Migrate existing data from profiles to services
INSERT INTO services (user_id, title, description, category, created_at, updated_at)
SELECT id, service_title, service_description, service_category, created_at, updated_at
FROM profiles
WHERE service_title IS NOT NULL AND service_title != '';

-- Optional: Clear old columns from profiles (or keep them as "primary" service for now to avoid breaking things immediately)
-- We will keep them for now as a fallback/cache, but the app will primarily use the services table.
-- Eventually we should drop them:
-- ALTER TABLE profiles DROP COLUMN service_title;
-- ALTER TABLE profiles DROP COLUMN service_description;
-- ALTER TABLE profiles DROP COLUMN service_category;
