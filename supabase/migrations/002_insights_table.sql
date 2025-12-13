-- Create insights table to store generated pattern insights
CREATE TABLE public.insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  pattern_count INTEGER DEFAULT 0, -- How many patterns this insight was based on
  patterns_snapshot JSONB, -- Snapshot of patterns at time of insight generation
  viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_insights_user_id ON public.insights(user_id);
CREATE INDEX idx_insights_viewed ON public.insights(viewed);
CREATE INDEX idx_insights_created_at ON public.insights(created_at DESC);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own insights" ON public.insights
  FOR ALL USING (auth.uid() = user_id);

-- Add a flag to users table to track if they have unseen patterns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_new_patterns BOOLEAN DEFAULT false;
