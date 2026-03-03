-- Migration 004: Create need_votes table for time-stamped, de-duplicated voting
-- Run in Supabase SQL Editor

-- 1. Create the votes table
CREATE TABLE IF NOT EXISTS need_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    need_id UUID NOT NULL REFERENCES local_needs(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    voter_identifier TEXT NOT NULL,  -- user_id for authenticated users, hash(IP+fingerprint) for guests
    voted_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- One vote per person per need
    UNIQUE(need_id, voter_identifier)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_need_votes_need_id ON need_votes(need_id);
CREATE INDEX IF NOT EXISTS idx_need_votes_voted_at ON need_votes(voted_at);
CREATE INDEX IF NOT EXISTS idx_need_votes_voter ON need_votes(voter_identifier);

-- 3. Row Level Security
ALTER TABLE need_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a vote (guests too)
DROP POLICY IF EXISTS "Anyone can insert vote" ON need_votes;
CREATE POLICY "Anyone can insert vote"
    ON need_votes FOR INSERT
    WITH CHECK (true);

-- Anyone can read votes (for displaying counts, checking existing votes)
DROP POLICY IF EXISTS "Anyone can read votes" ON need_votes;
CREATE POLICY "Anyone can read votes"
    ON need_votes FOR SELECT
    USING (true);

-- Grant access to anon and authenticated roles
GRANT SELECT, INSERT ON need_votes TO anon, authenticated;

-- 4. Trigger to sync cached vote counters on local_needs
CREATE OR REPLACE FUNCTION sync_need_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
    target_need_id UUID;
BEGIN
    -- Determine which need_id to update
    target_need_id := COALESCE(NEW.need_id, OLD.need_id);

    UPDATE local_needs SET
        upvotes = (SELECT COUNT(*) FROM need_votes WHERE need_id = target_need_id AND vote_type = 'up'),
        downvotes = (SELECT COUNT(*) FROM need_votes WHERE need_id = target_need_id AND vote_type = 'down')
    WHERE id = target_need_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_need_votes ON need_votes;
CREATE TRIGGER trg_sync_need_votes
AFTER INSERT OR DELETE ON need_votes
FOR EACH ROW EXECUTE FUNCTION sync_need_vote_counts();
