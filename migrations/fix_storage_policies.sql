-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-files', 'cv-files', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects if not already enabled (it usually is)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual deletes" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;

-- Policy 1: Allow public read access to files in cv-files bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'cv-files' );

-- Policy 2: Allow authenticated users to upload files to cv-files bucket
-- We restrict uploads so users can only upload files with their own user ID as prefix or just allow any auth user for now to be safe
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cv-files' );

-- Policy 3: Allow users to update their own files
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'cv-files' AND (auth.uid() = owner) );

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'cv-files' AND (auth.uid() = owner) );
