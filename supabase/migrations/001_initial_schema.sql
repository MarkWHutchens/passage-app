-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT, -- User's preferred name
  entry_point TEXT, -- burnout, grief, divorce, addiction, career, illness, transition, other
  subscription_status TEXT DEFAULT 'trial', -- trial, active, cancelled, expired
  subscription_id TEXT, -- Stripe subscription ID
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own row
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT, -- Auto-generated from first message
  entry_point TEXT, -- Snapshot of user's entry point at time of conversation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- Create messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  input_type TEXT, -- 'voice' or 'text' (for user messages)
  audio_url TEXT, -- Original audio if voice input
  tokens_used INTEGER,
  model_used TEXT, -- 'haiku' or 'sonnet'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own messages" ON public.messages
  FOR ALL USING (auth.uid() = user_id);

-- Create memory_tags table
CREATE TABLE public.memory_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  tag_type TEXT NOT NULL, -- 'remind', 'important', 'therapist', 'pattern', 'custom'
  custom_label TEXT, -- For custom tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_memory_tags_user_id ON public.memory_tags(user_id);
CREATE INDEX idx_memory_tags_tag_type ON public.memory_tags(tag_type);

ALTER TABLE public.memory_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tags" ON public.memory_tags
  FOR ALL USING (auth.uid() = user_id);

-- Create patterns table
CREATE TABLE public.patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  pattern_type TEXT NOT NULL, -- 'recurring_theme', 'emotion', 'trigger', 'progress'
  description TEXT NOT NULL,
  evidence_message_ids UUID[] DEFAULT '{}',
  first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_patterns_user_id ON public.patterns(user_id);

ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own patterns" ON public.patterns
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
