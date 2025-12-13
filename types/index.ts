export type EntryPoint = 
  | 'burnout' 
  | 'grief' 
  | 'divorce' 
  | 'addiction' 
  | 'career' 
  | 'illness' 
  | 'transition' 
  | 'other';

export type Country = 
  | 'australia'
  | 'united-states'
  | 'united-kingdom'
  | 'canada'
  | 'new-zealand'
  | 'ireland'
  | 'other';

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired';

export type MessageRole = 'user' | 'assistant';

export type InputType = 'voice' | 'text';

export type ModelType = 'haiku' | 'sonnet';

export type TagType = 'remind' | 'important' | 'therapist' | 'pattern' | 'custom';

export type PatternType = 'recurring_theme' | 'emotion' | 'trigger' | 'progress';

export interface User {
  id: string;
  email: string;
  entry_point?: EntryPoint;
  name?: string;
  country?: Country;
  subscription_status: SubscriptionStatus;
  subscription_id?: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  entry_point?: EntryPoint;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  input_type?: InputType;
  audio_url?: string;
  tokens_used?: number;
  model_used?: ModelType;
  created_at: string;
}

export interface MemoryTag {
  id: string;
  user_id: string;
  message_id: string;
  tag_type: TagType;
  custom_label?: string;
  created_at: string;
}

export interface Pattern {
  id: string;
  user_id: string;
  pattern_type: PatternType;
  description: string;
  evidence_message_ids: string[];
  first_detected_at: string;
  last_seen_at: string;
  occurrence_count: number;
  is_active: boolean;
}

export interface PineconeMetadata {
  user_id: string;
  conversation_id: string;
  message_id: string;
  role: MessageRole;
  timestamp: string;
  entry_point: string;
  tags?: string[];
}

export interface ModelContext {
  messageCount: number;
  hasPatternQuery: boolean;
  isRecallQuery: boolean;
  messageLength: number;
  conversationDepth: number;
}
