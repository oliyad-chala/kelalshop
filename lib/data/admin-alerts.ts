import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type AdminAlertCounts = {
  pendingProducts: number
  pendingVerifications: number
  pendingPayments: number
  pendingCampaignReviews: number
  openDisputes: number
  pendingOrders: number
  unreadSupportMessages: number
}

export function totalAlertCount(c: AdminAlertCounts): number {
  return (
    c.pendingProducts +
    c.pendingVerifications +
    c.pendingPayments +
    c.pendingCampaignReviews +
    c.openDisputes +
    c.pendingOrders +
    c.unreadSupportMessages
  )
}

export async function getAdminAlertCounts(
  admin: SupabaseClient<Database>,
  adminUserId?: string
): Promise<AdminAlertCounts> {
  const [
    { count: pendingProducts },
    { count: pendingVerifications },
    { count: pendingPayments },
    { count: pendingCampaignReviews },
    { count: openDisputes },
    { count: pendingOrders },
    { count: unreadSupportMessages },
  ] = await Promise.all([
    admin.from('products').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    admin.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('promotion_products').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
    admin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    adminUserId
      ? admin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', adminUserId)
          .eq('is_read', false)
      : Promise.resolve({ count: 0 }),
  ])

  return {
    pendingProducts: pendingProducts ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    pendingPayments: pendingPayments ?? 0,
    pendingCampaignReviews: pendingCampaignReviews ?? 0,
    openDisputes: openDisputes ?? 0,
    pendingOrders: pendingOrders ?? 0,
    unreadSupportMessages: unreadSupportMessages ?? 0,
  }
}

export type PendingProductRow = {
  id: string
  name: string
  created_at: string
  shopperName: string
}

export async function getRecentPendingProducts(
  admin: SupabaseClient<Database>,
  limit = 10
): Promise<PendingProductRow[]> {
  const { data } = await admin
    .from('products')
    .select('id, name, created_at, profiles:shopper_id(full_name)')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    created_at: p.created_at,
    shopperName: p.profiles?.full_name ?? 'Unknown seller',
  }))
}
