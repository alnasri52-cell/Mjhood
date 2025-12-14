-- 1. Allow NULLs for location columns in profiles and asset tables
ALTER TABLE profiles ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN longitude DROP NOT NULL;

-- 2. Ensure dependent tables also allow nulls
DO $$
BEGIN
    -- Service Categories (The active services table)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_categories') THEN
        ALTER TABLE service_categories ALTER COLUMN latitude DROP NOT NULL;
        ALTER TABLE service_categories ALTER COLUMN longitude DROP NOT NULL;
    END IF;

    -- Services (Legacy or View - handle if it's a base table)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'services' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE services ALTER COLUMN latitude DROP NOT NULL;
        ALTER TABLE services ALTER COLUMN longitude DROP NOT NULL;
    END IF;

    -- Resources
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resources') THEN
        ALTER TABLE resources ALTER COLUMN latitude DROP NOT NULL;
        ALTER TABLE resources ALTER COLUMN longitude DROP NOT NULL;
    END IF;

    -- CVs
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cvs') THEN
        ALTER TABLE cvs ALTER COLUMN latitude DROP NOT NULL;
        ALTER TABLE cvs ALTER COLUMN longitude DROP NOT NULL;
    END IF;
END $$;

-- 3. Update sync_profile_location to target the correct tables
CREATE OR REPLACE FUNCTION sync_profile_location() RETURNS TRIGGER AS $$
BEGIN
    -- Update service_categories (The primary services table)
    -- We use exception handling to avoid errors if tables don't exist
    BEGIN
        UPDATE service_categories SET latitude = NEW.latitude, longitude = NEW.longitude WHERE user_id = NEW.id;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Update services (Legacy table)
    BEGIN
         UPDATE services SET latitude = NEW.latitude, longitude = NEW.longitude WHERE user_id = NEW.id;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Update resources
    BEGIN
        UPDATE resources SET latitude = NEW.latitude, longitude = NEW.longitude WHERE user_id = NEW.id;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- Update cvs
    BEGIN
        UPDATE cvs SET latitude = NEW.latitude, longitude = NEW.longitude WHERE user_id = NEW.id;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. FIX BROKEN PROFILES
-- Insert profiles for users that exist in auth.users but missing in public.profiles
INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    username, 
    contact_email,
    country
)
SELECT 
    id, 
    raw_user_meta_data->>'full_name', 
    COALESCE(raw_user_meta_data->>'role', 'client'),
    raw_user_meta_data->>'username',
    raw_user_meta_data->>'contact_email',
    raw_user_meta_data->>'country'
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);
