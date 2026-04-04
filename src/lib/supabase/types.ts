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
      profiles: {
        Row: {
          id: string
          name: string | null
          currency: string | null
          monthly_income: string | null
          email_notifications: boolean | null
          created_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          currency?: string | null
          monthly_income?: string | null
          email_notifications?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          currency?: string | null
          monthly_income?: string | null
          email_notifications?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: string
          merchant: string
          category: string
          note: string | null
          date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: string | number
          merchant: string
          category?: string
          note?: string | null
          date?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: string | number
          merchant?: string
          category?: string
          note?: string | null
          date?: string
          created_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: string
          renewal_day: number
          category: string
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: string | number
          renewal_day: number
          category?: string
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: string | number
          renewal_day?: number
          category?: string
          active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          monthly_limit: string
          month: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          monthly_limit: string | number
          month: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          monthly_limit?: string | number
          month?: string
          created_at?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          user_id: string
          type: string
          sent_at: string | null
          payload: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          sent_at?: string | null
          payload?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          sent_at?: string | null
          payload?: Json | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
