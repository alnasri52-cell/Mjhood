-- Create CVs table for user curriculum vitae
-- This allows users to create and display their resumes on the map

CREATE TABLE IF NOT EXISTS cvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Location (displayed on map)
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  
  -- Basic Info
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  
  -- Professional Summary
  job_title TEXT,
  summary TEXT,
  
  -- Work Experience (JSONB array)
  -- Format: [{ title, company, duration, description }]
  work_experience JSONB DEFAULT '[]'::jsonb,
  
  -- Education (JSONB array)
  -- Format: [{ degree, institution, year }]
  education JSONB DEFAULT '[]'::jsonb,
  
  -- Skills (text array)
  skills TEXT[],
  
  -- Languages (JSONB array)
  -- Format: [{ language, proficiency }]
  languages JSONB DEFAULT '[]'::jsonb,
  
  -- Certifications (JSONB array)
  -- Format: [{ name, issuer, year }]
  certifications JSONB DEFAULT '[]'::jsonb,
  
  -- File Upload
  cv_file_url TEXT,
  
  -- Portfolio/Work Samples
  portfolio_urls TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_location ON cvs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_cvs_deleted_at ON cvs(deleted_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cvs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cvs_updated_at
  BEFORE UPDATE ON cvs
  FOR EACH ROW
  EXECUTE FUNCTION update_cvs_updated_at();

-- Enable Row Level Security
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view non-deleted CVs (public)
CREATE POLICY "CVs are viewable by everyone" ON cvs
  FOR SELECT USING (deleted_at IS NULL);

-- Users can insert their own CV (one per user enforced by UNIQUE constraint)
CREATE POLICY "Users can insert own CV" ON cvs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own CV
CREATE POLICY "Users can update own CV" ON cvs
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can soft-delete their own CV (sets deleted_at)
CREATE POLICY "Users can delete own CV" ON cvs
  FOR DELETE USING (auth.uid() = user_id);

-- Comment on table
COMMENT ON TABLE cvs IS 'User curriculum vitae (resumes) displayed on the map';
