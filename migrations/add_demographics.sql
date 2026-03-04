-- Add demographic fields to profiles table
-- These are collected during registration for B2B data aggregation

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_of_birth integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'prefer_not_to_say'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_status text CHECK (employment_status IN ('employed', 'self_employed', 'student', 'unemployed', 'retired', 'prefer_not_to_say'));

-- Update the handle_new_user trigger to also save demographic fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, year_of_birth, gender, employment_status)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        NULLIF(new.raw_user_meta_data->>'year_of_birth', '')::integer,
        NULLIF(new.raw_user_meta_data->>'gender', ''),
        NULLIF(new.raw_user_meta_data->>'employment_status', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        year_of_birth = COALESCE(EXCLUDED.year_of_birth, profiles.year_of_birth),
        gender = COALESCE(EXCLUDED.gender, profiles.gender),
        employment_status = COALESCE(EXCLUDED.employment_status, profiles.employment_status);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
