-- Add onboarding_complete field to users table
-- Default to false so new users go through onboarding
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_onboarding_complete ON public.users(onboarding_complete);
