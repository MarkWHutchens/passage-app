-- Add missing columns that are referenced in the app
-- Run this in Supabase Dashboard → SQL Editor to fix 400 errors

-- Add has_new_patterns column (used by insights feature)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS has_new_patterns BOOLEAN DEFAULT false;

-- Add voice_preference column if not exists (from earlier migration)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS voice_preference TEXT DEFAULT 'nova';

-- Add voice validation constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_voice_option'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT valid_voice_option 
      CHECK (voice_preference IN ('nova', 'shimmer', 'alloy', 'echo', 'fable', 'onyx'));
  END IF;
END $$;
