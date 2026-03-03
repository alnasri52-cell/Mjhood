-- Track need shares for analytics
CREATE TABLE IF NOT EXISTS need_shares (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    need_id uuid NOT NULL REFERENCES local_needs(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    platform text, -- 'whatsapp', 'twitter', 'copy', 'other'
    created_at timestamptz DEFAULT now()
);

-- Index for counting shares per need
CREATE INDEX IF NOT EXISTS idx_need_shares_need_id ON need_shares(need_id);

-- Add share_count to local_needs for quick access
ALTER TABLE local_needs ADD COLUMN IF NOT EXISTS share_count integer DEFAULT 0;

-- Enable RLS
ALTER TABLE need_shares ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a share record
CREATE POLICY "Anyone can track shares" ON need_shares
    FOR INSERT WITH CHECK (true);

-- Anyone can read share counts
CREATE POLICY "Anyone can read shares" ON need_shares
    FOR SELECT USING (true);
