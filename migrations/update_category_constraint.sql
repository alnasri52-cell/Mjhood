-- Update category check constraint to match new categories in constants.ts
-- Run in Supabase SQL Editor

ALTER TABLE local_needs DROP CONSTRAINT IF EXISTS chk_local_needs_category;

ALTER TABLE local_needs ADD CONSTRAINT chk_local_needs_category CHECK (
    category IN (
        'Mosque',
        'Cafe',
        'Restaurant',
        'Bakery',
        'Drive-Thru Kiosk',
        'Grocery Store',
        'Mall',
        'Pharmacy',
        'Medical Center',
        'Gym',
        'Salon',
        'Laundromat',
        'Auto Repair',
        'Car Wash',
        'Gas Station',
        'EV Charging',
        'Private School',
        'Co-working Space',
        'Sports Venue',
        'Park',
        'ATM / Bank Branch',
        'Public Restroom',
        'Other'
    )
);
