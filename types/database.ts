export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          entry_point: string | null
          country: string | null
          subscription_status: string
          subscription_id: string | null
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          entry_point?: string | null
          subscription_status?: string
          subscription_id?: string | null
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          entry_point?: string | null
          country?: string | null
          subscription_status?: string
          subscription_id?: string | null
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          entry_point: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          entry_point?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          entry_point?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: string
          content: string
          input_type: string | null
          audio_url: string | null
          tokens_used: number | null
          model_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          role: string
          content: string
          input_type?: string | null
          audio_url?: string | null
          tokens_used?: number | null
          model_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: string
          content?: string
          input_type?: string | null
          audio_url?: string | null
          tokens_used?: number | null
          model_used?: string | null
          created_at?: string
        }
      }
      memory_tags: {
        Row: {
          id: string
          user_id: string
          message_id: string
          tag_type: string
          custom_label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message_id: string
          tag_type: string
          custom_label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message_id?: string
          tag_type?: string
          custom_label?: string | null
          created_at?: string
        }
      }
      patterns: {
        Row: {
          id: string
          user_id: string
          pattern_type: string
          description: string
          evidence_message_ids: string[]
          first_detected_at: string
          last_seen_at: string
          occurrence_count: number
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          pattern_type: string
          description: string
          evidence_message_ids?: string[]
          first_detected_at?: string
          last_seen_at?: string
          occurrence_count?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          pattern_type?: string
          description?: string
          evidence_message_ids?: string[]
          first_detected_at?: string
          last_seen_at?: string
          occurrence_count?: number
          is_active?: boolean
        }
      }
      crisis_resources: {
        Row: {
          id: string
          country_code: string
          country_name: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          country_code: string
          country_name: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          country_code?: string
          country_name?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
