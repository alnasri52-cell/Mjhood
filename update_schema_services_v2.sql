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
-- Note: profiles table might not have created_at/updated_at, so we use now()
INSERT INTO services (user_id, title, description, category, created_at, updated_at)
SELECT 
    id as user_id, 
    service_title, 
    service_description, 
    service_category, 
    now(), 
    now() -- Use current time for migration if original timestamps aren't available
FROM profiles
WHERE service_title IS NOT NULL AND service_title != '';
