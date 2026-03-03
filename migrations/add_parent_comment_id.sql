-- Add parent_comment_id to need_comments for threaded/nested replies
ALTER TABLE need_comments
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES need_comments(id) ON DELETE CASCADE;
