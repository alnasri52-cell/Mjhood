-- Find all constraints on the cvs table
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'cvs'::regclass;

-- Drop the foreign key constraint (try different possible names)
ALTER TABLE cvs DROP CONSTRAINT IF EXISTS cvs_user_id_fkey CASCADE;
ALTER TABLE cvs DROP CONSTRAINT IF EXISTS cvs_user_id_fkey1 CASCADE;
ALTER TABLE cvs DROP CONSTRAINT IF EXISTS fk_cvs_user CASCADE;

-- Verify it's gone
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'cvs'::regclass;
