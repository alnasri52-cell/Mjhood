-- 1. Update handle_new_user to capture latitude, longitude, country, username, email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role,
    latitude,
    longitude,
    country,
    username,
    contact_email
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    (NEW.raw_user_meta_data->>'latitude')::numeric,
    (NEW.raw_user_meta_data->>'longitude')::numeric,
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'contact_email'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Sync Function to update child tables when Profile Location changes
CREATE OR REPLACE FUNCTION sync_profile_location() RETURNS TRIGGER AS $$
BEGIN
    -- Update Services
    UPDATE services SET latitude = NEW.latitude, longitude = NEW.longitude WHERE user_id = NEW.id;
    -- Update Resources
    UPDATE resources SET latitude = NEW.latitude, longitude = NEW.longitude WHERE user_id = NEW.id;
    -- Update CVs
    UPDATE cvs SET latitude = NEW.latitude, longitude = NEW.longitude WHERE user_id = NEW.id;
    
    -- Also update legacy columns if we want to keep them consistent just in case
    -- (Optional, but good for data integrity if queries still use them)
    UPDATE profiles SET 
        service_location_lat = NEW.latitude, 
        service_location_lng = NEW.longitude,
        resource_location_lat = NEW.latitude,
        resource_location_lng = NEW.longitude
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger on Profiles
DROP TRIGGER IF EXISTS on_profile_location_change ON profiles;
CREATE TRIGGER on_profile_location_change
AFTER UPDATE OF latitude, longitude ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_location();

-- 4. Backfill existing data
-- Use service_location if available
UPDATE profiles 
SET latitude = service_location_lat, longitude = service_location_lng 
WHERE latitude IS NULL AND service_location_lat IS NOT NULL;

-- Use resource_location if available and still null
UPDATE profiles 
SET latitude = resource_location_lat, longitude = resource_location_lng 
WHERE latitude IS NULL AND resource_location_lat IS NOT NULL;
