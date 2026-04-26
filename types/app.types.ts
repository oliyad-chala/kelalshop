import type { Database, UserRole, VerificationStatus, OrderStatus, RequestStatus } from './database.types'

export type { UserRole, VerificationStatus, OrderStatus, RequestStatus }

// Base row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ShopperProfile = Database['public']['Tables']['shopper_profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type ImportSource = Database['public']['Tables']['import_sources']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type Request = Database['public']['Tables']['requests']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

// Enriched types (with joins)
export type ProductWithDetails = Product & {
  product_images: ProductImage[]
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'trust_score'>
  shopper_profiles: Pick<ShopperProfile, 'verification_status'> | null
  categories: Pick<Category, 'id' | 'name' | 'slug'> | null
}

export type ShopperWithProfile = Profile & {
  shopper_profiles: ShopperProfile & {
    shopper_categories: {
      categories: Category
    }[]
    shopper_sources: {
      import_sources: ImportSource
    }[]
  }
  reviews_as_reviewee: Review[]
}

export type RequestWithDetails = Request & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  categories: Pick<Category, 'id' | 'name' | 'slug'> | null
  shopper?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

export type OrderWithDetails = Order & {
  buyer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  shopper: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  products: Pick<Product, 'id' | 'name' | 'price'> & {
    product_images: ProductImage[]
  } | null
  requests: Pick<Request, 'id' | 'title'> | null
}

export type MessageWithSender = Message & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export type Conversation = {
  partner: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  lastMessage: Message
  unreadCount: number
}

// Form state types
export type ActionState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[]>
}

// ── Admin Portal Types ───────────────────────────────────────────────────────

export type AdminStats = {
  totalRevenue: number
  activeRequests: number
  newShoppers: number
  pendingVerifications: number
  totalShoppers: number
}

export type ShopperVerificationRow = {
  id: string
  fullName: string | null
  businessName: string | null
  createdAt: string
  idFrontUrl: string | null
  idBackUrl: string | null
}

export type PendingPayoutRow = {
  id: string
  buyer: string
  shopper: string
  amount: number
  commission_rate: number
  created_at: string
}

export type AdminTrustRow = {
  id: string
  name: string
  trustScore: number
  avgRating: number
  totalReviews: number
  verificationStatus: VerificationStatus
  totalOrders: number
}

export type OrderVolumePoint = {
  date: string
  revenue: number
  orders: number
}

export type CategoryPoint = {
  name: string
  count: number
}
