-- Add voice_muted field to users table
-- When false/null, voice is enabled (default)
-- When true, voice is muted (text only)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS voice_muted BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_voice_muted ON public.users(voice_muted);
