-- Add missing columns for real profile data
ALTER TABLE history_analysis 
ADD COLUMN IF NOT EXISTS following_count INTEGER,
ADD COLUMN IF NOT EXISTS posts_count INTEGER,
ADD COLUMN IF NOT EXISTS profile_data JSONB;