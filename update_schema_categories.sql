-- Add service_category column to profiles table
ALTER TABLE profiles 
ADD COLUMN service_category text;

-- Optional: Add a check constraint to ensure valid categories (or handle in app logic)
-- For flexibility, we'll stick to text for now, but app should enforce the list.
