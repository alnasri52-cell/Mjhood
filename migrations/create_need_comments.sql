-- Create need_comments table for discussions on needs
CREATE TABLE IF NOT EXISTS need_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    need_id UUID NOT NULL REFERENCES local_needs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups by need
CREATE INDEX IF NOT EXISTS idx_need_comments_need_id ON need_comments(need_id);
CREATE INDEX IF NOT EXISTS idx_need_comments_created_at ON need_comments(created_at);

-- Enable RLS
ALTER TABLE need_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read comments
CREATE POLICY "Anyone can read need comments"
    ON need_comments FOR SELECT
    USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Authenticated users can insert comments"
    ON need_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON need_comments FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
    ON need_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE need_comments;
