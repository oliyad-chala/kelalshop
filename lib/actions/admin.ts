'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** Verify the request comes from a logged-in admin. Returns the service-role client. */
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden: admin access only')

  return createAdminClient()
}

// ── Verifications ────────────────────────────────────────────────────────────

export async function approveVerification(shopperId: string) {
  const admin = await requireAdmin()
  const { error } = await admin
    .from('shopper_profiles')
    .update({ verification_status: 'verified', updated_at: new Date().toISOString() } as any)
    .eq('id', shopperId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/verifications')
}

export async function rejectVerification(shopperId: string) {
  const admin = await requireAdmin()
  const { error } = await admin
    .from('shopper_profiles')
    .update({ verification_status: 'rejected', updated_at: new Date().toISOString() } as any)
    .eq('id', shopperId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/verifications')
}

// ── Payouts ──────────────────────────────────────────────────────────────────

export async function releasePayout(orderId: string) {
  const admin = await requireAdmin()

  const { data: order, error: fetchErr } = await admin
    .from('orders')
    .select('amount, shopper_id, commission_rate')
    .eq('id', orderId)
    .eq('status', 'delivered')
    .eq('payout_released', false)
    .single()

  if (fetchErr || !order) throw new Error('Order not found or payout already released.')

  const payout = Number(order.amount) * (1 - (order.commission_rate ?? 0.05))

  await admin
    .rpc('credit_shopper_wallet', { p_shopper_id: order.shopper_id, p_amount: payout })
    .maybeSingle()

  const { error } = await admin
    .from('orders')
    .update({ payout_released: true, updated_at: new Date().toISOString() } as any)
    .eq('id', orderId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/payouts')
}

// ── Products ─────────────────────────────────────────────────────────────────

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  const admin = await requireAdmin()
  const { error } = await admin
    .from('products')
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() } as any)
    .eq('id', productId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

// ── Analytics ────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const admin = await requireAdmin()

  const [
    { data: orders },
    { count: activeRequests },
    { count: newShoppers },
    { count: pendingVerifications },
    { count: totalShoppers },
  ] = await Promise.all([
    admin.from('orders').select('amount'),
    admin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin
      .from('shopper_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }),
  ])

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.amount), 0) ?? 0

  return {
    totalRevenue,
    activeRequests: activeRequests ?? 0,
    newShoppers: newShoppers ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    totalShoppers: totalShoppers ?? 0,
  }
}

export async function getOrderVolumeChart() {
  const admin = await requireAdmin()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await admin
    .from('orders')
    .select('amount, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (!data) return []

  // Group by day
  const byDay: Record<string, { date: string; revenue: number; orders: number }> = {}
  for (const o of data) {
    const day = o.created_at.slice(0, 10)
    if (!byDay[day]) byDay[day] = { date: day, revenue: 0, orders: 0 }
    byDay[day].revenue += Number(o.amount)
    byDay[day].orders += 1
  }

  return Object.values(byDay)
}

export async function getCategoryChart() {
  const admin = await requireAdmin()
  const { data } = await admin
    .from('products')
    .select('categories(name)')
    .not('category_id', 'is', null)

  if (!data) return []

  const counts: Record<string, number> = {}
  for (const p of data as any[]) {
    const name = p.categories?.name ?? 'Uncategorised'
    counts[name] = (counts[name] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}
