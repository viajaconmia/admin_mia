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
      reservations: {
        Row: {
          id: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          reservation_date: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          reservation_date: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          reservation_date?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      reservation_history: {
        Row: {
          id: string
          reservation_id: string
          changed_by: string
          old_status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | null
          new_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at: string
        }
      }
      admin_notes: {
        Row: {
          id: string
          reservation_id: string
          admin_id: string
          note: string
          created_at: string
        }
      }
    }
    Functions: {
      update_reservation_status: {
        Args: {
          reservation_id: string
          new_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          admin_id: string
        }
        Returns: void
      }
    }
  }
}