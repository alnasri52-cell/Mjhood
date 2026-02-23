-- Add foreign key from need_comments.user_id to profiles.id
-- This allows PostgREST/Supabase to join need_comments with profiles
ALTER TABLE need_comments
    ADD CONSTRAINT need_comments_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
