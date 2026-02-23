-- Add upvotes and downvotes columns to need_comments
ALTER TABLE need_comments
    ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;
