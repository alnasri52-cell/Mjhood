-- Add parent_id for threaded/nested comments (Reddit-style)
ALTER TABLE need_comments
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES need_comments(id) ON DELETE CASCADE;

-- Index for fast child comment lookups
CREATE INDEX IF NOT EXISTS idx_need_comments_parent_id ON need_comments(parent_id);
