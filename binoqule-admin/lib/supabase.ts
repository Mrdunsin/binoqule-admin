import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      authors: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          bio: string | null
          focus_area: string | null
          photo_url: string | null
          order_position: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['authors']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['authors']['Insert']>
      }
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          deck: string | null
          content: any
          author_id: string | null
          category: string
          tags: string[]
          cover_image_url: string | null
          read_time: number | null
          status: 'draft' | 'published'
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      subscribers: {
        Row: {
          id: string
          email: string
          status: 'active' | 'unsubscribed'
          source: string
          subscribed_at: string
          unsubscribed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscribers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subscribers']['Insert']>
      }
      lawyer_submissions: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          area_of_law: string
          issue: string
          urgency: string | null
          status: 'pending' | 'assigned' | 'resolved' | 'closed'
          assigned_to: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['lawyer_submissions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['lawyer_submissions']['Insert']>
      }
      email_campaigns: {
        Row: {
          id: string
          subject: string
          content: any
          html_content: string | null
          recipient_count: number
          status: 'draft' | 'sent'
          sent_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['email_campaigns']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['email_campaigns']['Insert']>
      }
    }
  }
}
