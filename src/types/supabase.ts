
// 📁 src/types/supabase.ts (ENSURE THIS FILE EXISTS WITH CORRECT TYPES)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          profile_picture: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          mfa_enabled: boolean
          security_score: number
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          profile_picture?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          mfa_enabled?: boolean
          security_score?: number
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          profile_picture?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          mfa_enabled?: boolean
          security_score?: number
        }
      }
      capsules: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          data_types: string[]
          content: Json
          metadata: Json
          sharing: Json
          security: Json
          created_at: string
          updated_at: string
          last_accessed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          data_types: string[]
          content?: Json
          metadata?: Json
          sharing?: Json
          security?: Json
          created_at?: string
          updated_at?: string
          last_accessed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          data_types?: string[]
          content?: Json
          metadata?: Json
          sharing?: Json
          security?: Json
          created_at?: string
          updated_at?: string
          last_accessed_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          capsule_id: string | null
          action: string
          description: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          capsule_id?: string | null
          action: string
          description: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          capsule_id?: string | null
          action?: string
          description?: string
          metadata?: Json
          created_at?: string
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

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]