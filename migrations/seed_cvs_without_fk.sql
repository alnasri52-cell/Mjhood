-- Temporarily disable foreign key constraint for test data
ALTER TABLE cvs DROP CONSTRAINT IF EXISTS cvs_user_id_fkey;

-- Now run the CV seed data
-- (Copy and paste the content from seed_test_data_part5_cvs.sql here)

-- Re-enable the foreign key constraint
ALTER TABLE cvs ADD CONSTRAINT cvs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
