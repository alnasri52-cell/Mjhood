-- Migration 003: Add status lifecycle enum to local_needs
-- Run in Supabase SQL Editor

-- 1. Add status column with CHECK constraint
ALTER TABLE local_needs
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE local_needs
DROP CONSTRAINT IF EXISTS chk_local_needs_status;

ALTER TABLE local_needs
ADD CONSTRAINT chk_local_needs_status CHECK (
    status IN ('active', 'fulfilled', 'archived')
);

-- 2. Backfill: mark soft-deleted rows as archived
UPDATE local_needs
SET status = 'archived'
WHERE deleted_at IS NOT NULL AND status = 'active';

-- 3. Index for filtering by status (most queries filter on this)
CREATE INDEX IF NOT EXISTS idx_local_needs_status ON local_needs(status);
