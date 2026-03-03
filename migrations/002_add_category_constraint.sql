-- Migration 002: Add CHECK constraint for category validation
-- Run in Supabase SQL Editor

-- Ensure all existing categories are valid before adding constraint
-- (This will fail if any row has an invalid category — fix those first)

ALTER TABLE local_needs
DROP CONSTRAINT IF EXISTS chk_local_needs_category;

ALTER TABLE local_needs
ADD CONSTRAINT chk_local_needs_category CHECK (
    category IN (
        'Grocery Store',
        'Pharmacy',
        'ATM / Bank',
        'Park / Green Space',
        'Public Restroom',
        'Mosque / Place of Worship',
        'School / Kindergarten',
        'Hospital / Clinic',
        'Gym / Fitness Center',
        'Cafe / Restaurant',
        'Public Transport Stop',
        'Post Office',
        'Library',
        'Community Center',
        'Other'
    )
);
