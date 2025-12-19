-- Add analysis tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_pattern_analysis TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_insight_generation TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conversation_count_at_last_analysis INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN users.last_pattern_analysis IS 'Timestamp of last automatic pattern analysis';
COMMENT ON COLUMN users.last_insight_generation IS 'Timestamp of last automatic insight generation';
COMMENT ON COLUMN users.conversation_count_at_last_analysis IS 'Number of conversations when last pattern analysis was run';
