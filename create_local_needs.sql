-- Create local_needs table
CREATE TABLE IF NOT EXISTS local_needs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE local_needs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read needs
CREATE POLICY "Anyone can view local needs"
    ON local_needs FOR SELECT
    USING (true);

-- Create policy to allow anyone to insert needs (since we want non-registered users to participate, 
-- but ideally we should track them. For now, we allow public insert as requested)
CREATE POLICY "Anyone can insert local needs"
    ON local_needs FOR INSERT
    WITH CHECK (true);

-- Create policy to allow anyone to update votes (via RPC mostly, but RLS is good)
CREATE POLICY "Anyone can update local needs"
    ON local_needs FOR UPDATE
    USING (true);

-- Create RPC function for voting
CREATE OR REPLACE FUNCTION increment_vote(need_id UUID, vote_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF vote_type = 'up' THEN
        UPDATE local_needs
        SET upvotes = upvotes + 1
        WHERE id = need_id;
    ELSIF vote_type = 'down' THEN
        UPDATE local_needs
        SET downvotes = downvotes + 1
        WHERE id = need_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
