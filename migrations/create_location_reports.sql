-- Migration: Create location_reports table for integrity flagging
-- Tracks "Provider Not at Location" reports with auto-flagging

CREATE TABLE IF NOT EXISTS location_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reporter_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reporter_ip TEXT,
    report_type TEXT DEFAULT 'not_at_location' CHECK (report_type IN ('not_at_location', 'fake_location', 'other')),
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'verified')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE location_reports ENABLE ROW LEVEL SECURITY;

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

-- Create indexes
CREATE INDEX idx_location_reports_user_date 
    ON location_reports(reported_user_id, created_at DESC);

CREATE INDEX idx_location_reports_status 
    ON location_reports(status, created_at DESC);

CREATE INDEX idx_location_reports_reporter 
    ON location_reports(reporter_user_id, created_at DESC);

-- Auto-flagging trigger function
CREATE OR REPLACE FUNCTION auto_flag_location()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
    unique_reporters INTEGER;
BEGIN
    -- Count unique reports in last 48 hours
    SELECT 
        COUNT(*),
        COUNT(DISTINCT reporter_user_id)
    INTO report_count, unique_reporters
    FROM location_reports
    WHERE reported_user_id = NEW.reported_user_id
      AND created_at > NOW() - INTERVAL '48 hours'
      AND report_type = 'not_at_location'
      AND status = 'pending';
    
    -- Auto-flag if 3 or more unique reporters
    IF unique_reporters >= 3 THEN
        UPDATE profiles
        SET 
            location_flags = report_count,
            location_flagged_at = NOW()
        WHERE id = NEW.reported_user_id;
        
        -- Log the auto-flag event
        RAISE NOTICE 'Auto-flagged user % with % reports from % unique reporters', 
            NEW.reported_user_id, report_count, unique_reporters;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_auto_flag_location
    AFTER INSERT ON location_reports
    FOR EACH ROW
    EXECUTE FUNCTION auto_flag_location();

-- Add comments
COMMENT ON TABLE location_reports IS 'Tracks location integrity reports with auto-flagging at 3 unique reports in 48h';
COMMENT ON COLUMN location_reports.reporter_ip IS 'IP address for spam prevention';
COMMENT ON COLUMN location_reports.status IS 'Report review status: pending, reviewed, dismissed, verified';
