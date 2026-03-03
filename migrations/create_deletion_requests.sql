-- Create deletion_requests table for need deletion moderation
-- Users request deletion, moderators approve/reject

CREATE TABLE IF NOT EXISTS deletion_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    need_id uuid NOT NULL REFERENCES local_needs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own deletion requests
CREATE POLICY "Users can create deletion requests"
    ON deletion_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own deletion requests"
    ON deletion_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Only one pending request per need per user
CREATE UNIQUE INDEX idx_unique_pending_deletion
    ON deletion_requests (need_id, user_id)
    WHERE status = 'pending';
