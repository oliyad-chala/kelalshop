export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'buyer' | 'shopper' | 'admin'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type OrderStatus = 'pending' | 'accepted' | 'shipped' | 'delivered' | 'cancelled' | 'disputed'
export type RequestStatus = 'open' | 'assigned' | 'completed' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          location: string | null
          phone: string | null
          role: UserRole
          trust_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          phone?: string | null
          role?: UserRole
          trust_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          phone?: string | null
          role?: UserRole
          trust_score?: number
          updated_at?: string
        }
      }
      shopper_profiles: {
        Row: {
          id: string
          bio: string | null
          id_document_url: string | null
          id_document_back_url: string | null
          verification_status: VerificationStatus
          business_name: string | null
          delivery_time_days: number
          min_order_amount: number
          total_orders: number
          wallet_balance: number
          commission_rate: number
          agreed_to_terms: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          bio?: string | null
          id_document_url?: string | null
          id_document_back_url?: string | null
          verification_status?: VerificationStatus
          business_name?: string | null
          delivery_time_days?: number
          min_order_amount?: number
          total_orders?: number
          wallet_balance?: number
          commission_rate?: number
          agreed_to_terms?: boolean
        }
        Update: {
          bio?: string | null
          id_document_url?: string | null
          id_document_back_url?: string | null
          verification_status?: VerificationStatus
          business_name?: string | null
          delivery_time_days?: number
          min_order_amount?: number
          total_orders?: number
          wallet_balance?: number
          commission_rate?: number
          agreed_to_terms?: boolean
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
        }
        Update: {
          name?: string
          slug?: string
          icon?: string | null
        }
      }
      import_sources: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
        }
        Update: {
          name?: string
          slug?: string
          logo_url?: string | null
        }
      }
      shopper_categories: {
        Row: {
          shopper_id: string
          category_id: string
        }
        Insert: {
          shopper_id: string
          category_id: string
        }
        Update: {
          shopper_id?: string
          category_id?: string
        }
      }
      shopper_sources: {
        Row: {
          shopper_id: string
          source_id: string
        }
        Insert: {
          shopper_id: string
          source_id: string
        }
        Update: {
          shopper_id?: string
          source_id?: string
        }
      }
      products: {
        Row: {
          id: string
          shopper_id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          stock: number
          location: string | null
          is_available: boolean
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shopper_id: string
          category_id?: string | null
          name: string
          description?: string | null
          price: number
          stock?: number
          location?: string | null
          is_available?: boolean
          source_url?: string | null
        }
        Update: {
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          stock?: number
          location?: string | null
          is_available?: boolean
          source_url?: string | null
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          is_primary?: boolean
          sort_order?: number
        }
        Update: {
          url?: string
          is_primary?: boolean
          sort_order?: number
        }
      }
      requests: {
        Row: {
          id: string
          buyer_id: string
          shopper_id: string | null
          category_id: string | null
          title: string
          description: string
          source_url: string | null
          budget: number | null
          status: RequestStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          shopper_id?: string | null
          category_id?: string | null
          title: string
          description: string
          source_url?: string | null
          budget?: number | null
          status?: RequestStatus
        }
        Update: {
          shopper_id?: string | null
          category_id?: string | null
          title?: string
          description?: string
          source_url?: string | null
          budget?: number | null
          status?: RequestStatus
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          request_id: string | null
          product_id: string | null
          buyer_id: string
          shopper_id: string
          amount: number
          commission_rate: number
          status: OrderStatus
          payout_released: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id?: string | null
          product_id?: string | null
          buyer_id: string
          shopper_id: string
          amount: number
          commission_rate?: number
          status?: OrderStatus
          payout_released?: boolean
          notes?: string | null
        }
        Update: {
          commission_rate?: number
          status?: OrderStatus
          payout_released?: boolean
          notes?: string | null
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          order_id: string | null
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
        }
        Update: {
          rating?: number
          comment?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          order_id: string | null
          request_id: string | null
          content: string
          image_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          order_id?: string | null
          request_id?: string | null
          content: string
          image_url?: string | null
          is_read?: boolean
        }
        Update: {
          image_url?: string | null
          is_read?: boolean
        }
      }
    }
  }
}
