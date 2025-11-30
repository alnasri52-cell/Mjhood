-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Allow public read access to services
CREATE POLICY "Public Services Access"
ON services FOR SELECT
USING (true);

-- Allow authenticated users to insert their own services
CREATE POLICY "Users can insert own services"
ON services FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own services
CREATE POLICY "Users can update own services"
ON services FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own services
CREATE POLICY "Users can delete own services"
ON services FOR DELETE
USING (auth.uid() = user_id);
