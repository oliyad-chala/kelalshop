
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'buyer' | 'shopper' | 'admin' | 'staff'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type OrderStatus = 'pending' | 'accepted' | 'shipped' | 'delivered' | 'cancelled' | 'disputed'
export type RequestStatus = 'open' | 'assigned' | 'completed' | 'cancelled'
export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected'
export type SubscriptionPlan = 'free' | 'pro'
export type ProductApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: any[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [key: string]: {
        Args: Record<string, any>
        Returns: any
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
