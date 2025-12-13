-- Add voice_preference column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS voice_preference TEXT DEFAULT 'nova';

-- Add check constraint to ensure valid voice options
ALTER TABLE public.users ADD CONSTRAINT valid_voice_option 
  CHECK (voice_preference IN ('nova', 'shimmer', 'alloy', 'echo', 'fable', 'onyx'));
