-- Enable RLS on location_reports table
ALTER TABLE location_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can submit reports" ON location_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON location_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON location_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON location_reports;

-- Re-create policies

-- Policy: Authenticated users can submit reports
CREATE POLICY "Authenticated users can submit reports"
    ON location_reports FOR INSERT
    WITH CHECK (
        auth.uid() = reporter_user_id OR 
        (auth.uid() IS NOT NULL AND reporter_user_id IS NULL)
    );

-- Policy: Users can view their own submitted reports
CREATE POLICY "Users can view own reports"
    ON location_reports FOR SELECT
    USING (auth.uid() = reporter_user_id);

-- Policy: Admins and moderators can view all reports
CREATE POLICY "Admins can view all reports"
    ON location_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

-- Policy: Admins can update report status
CREATE POLICY "Admins can update reports"
    ON location_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );
