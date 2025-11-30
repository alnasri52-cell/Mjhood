-- Drop the existing foreign key to auth.users
ALTER TABLE services
DROP CONSTRAINT IF EXISTS services_user_id_fkey;

-- Add a new foreign key to profiles.id
-- This allows Supabase to detect the relationship between 'profiles' and 'services'
ALTER TABLE services
ADD CONSTRAINT services_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;
