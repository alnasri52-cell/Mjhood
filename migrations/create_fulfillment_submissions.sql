-- Fulfillment Photo Queue
-- Run this in Supabase SQL Editor

-- 1. Create the fulfillment_submissions table
CREATE TABLE IF NOT EXISTS fulfillment_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    need_id UUID NOT NULL REFERENCES local_needs(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_fulfillment_need_id ON fulfillment_submissions(need_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_status ON fulfillment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_fulfillment_created ON fulfillment_submissions(created_at DESC);

-- 3. RLS policies
ALTER TABLE fulfillment_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can view submissions
CREATE POLICY "Anyone can view fulfillment submissions"
ON fulfillment_submissions FOR SELECT
USING (true);

-- Authenticated users can submit proof
CREATE POLICY "Authenticated users can submit proof"
ON fulfillment_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = submitted_by);

-- Only admins can update (approve/reject)
CREATE POLICY "Admins can update submissions"
ON fulfillment_submissions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 4. Add fulfilled_at and fulfilled_photo to local_needs
ALTER TABLE local_needs
ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fulfilled_photo TEXT;
