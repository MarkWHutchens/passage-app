-- Add last_journey_visit tracking to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_journey_visit TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN users.last_journey_visit IS 'Timestamp of last visit to Journey page - used to show "New" badges';
