-- Add image_urls column to local_needs table
ALTER TABLE local_needs ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- Create need-images storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('need-images', 'need-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read need images
CREATE POLICY "Anyone can view need images"
ON storage.objects FOR SELECT
USING (bucket_id = 'need-images');

-- Allow authenticated users to upload need images
CREATE POLICY "Authenticated users can upload need images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'need-images' AND auth.role() = 'authenticated');

-- Allow users to delete their own need images
CREATE POLICY "Users can delete own need images"
ON storage.objects FOR DELETE
USING (bucket_id = 'need-images' AND auth.uid()::text = (storage.foldername(name))[1]);
