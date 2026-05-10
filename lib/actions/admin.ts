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
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/verification')
}

export async function rejectVerification(shopperId: string) {
  const admin = await requireAdmin()
  const { error } = await admin
    .from('shopper_profiles')
    .update({ verification_status: 'rejected', updated_at: new Date().toISOString() } as any)
    .eq('id', shopperId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/verifications')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/verification')
}

// ── Payments & Subscriptions ───────────────────────────────────────────────────

export async function approvePayment(paymentId: string) {
  const admin = await requireAdmin()
  
  // 1. Get payment details
  const { data: payment, error: getError } = await admin
    .from('payment_requests')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (getError || !payment) throw new Error('Payment not found')
  if (payment.status !== 'pending') throw new Error('Payment is not pending')

  // 2. Apply the effect
  if (payment.payment_type === 'pro_subscription') {
    const expires = new Date()
    expires.setDate(expires.getDate() + 30) // 30 days
    
    const { error } = await admin
      .from('shopper_profiles')
      .update({ 
        subscription_plan: 'pro',
        subscription_expires_at: expires.toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', payment.shopper_id)
    
    if (error) throw new Error(error.message)
  } 
  else if (payment.payment_type === 'boost_7_days' || payment.payment_type === 'boost_28_days') {
    if (!payment.target_id) throw new Error('Missing product target ID')
    
    const days = payment.payment_type === 'boost_7_days' ? 7 : 28
    const expires = new Date()
    expires.setDate(expires.getDate() + days)

    const { error } = await admin
      .from('products')
      .update({
        is_featured: true,
        boosted_until: expires.toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', payment.target_id)
    
    if (error) throw new Error(error.message)
  }
  
  // 3. Mark approved
  await admin.from('payment_requests').update({ 
    status: 'approved',
    updated_at: new Date().toISOString()
  } as any).eq('id', paymentId)
  
  revalidatePath('/admin/payouts')
}

export async function rejectPayment(paymentId: string) {
  const admin = await requireAdmin()
  const { error } = await admin
    .from('payment_requests')
    .update({ 
      status: 'rejected',
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', paymentId)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/payouts')
}

// ── Manual Subscriptions ──────────────────────────────────────────────────────

export async function adminUpdateSubscription(shopperId: string, plan: 'free' | 'pro') {
  const admin = await requireAdmin()
  
  let expiresAt = null
  if (plan === 'pro') {
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    expiresAt = expires.toISOString()
  }

  const { error } = await admin
    .from('shopper_profiles')
    .update({ 
      subscription_plan: plan,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', shopperId)
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/sellers')
}

// ── Top Shoppers ─────────────────────────────────────────────────────────────

export async function toggleTopShopper(shopperId: string, isTop: boolean) {
  const admin = await requireAdmin()
  
  const { error } = await admin
    .from('shopper_profiles')
    .update({ 
      is_top_shopper: isTop,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', shopperId)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/trust')
  revalidatePath('/shoppers')
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

export async function adminToggleProductBoost(productId: string, boost: boolean) {
  const admin = await requireAdmin()
  
  let boostedUntil = null
  if (boost) {
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    boostedUntil = expires.toISOString()
  }

  const { error } = await admin
    .from('products')
    .update({ 
      is_featured: boost,
      boosted_until: boostedUntil,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', productId)
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/products')
  revalidatePath('/')
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
    { count: pendingPayments },
  ] = await Promise.all([
    admin.from('orders').select('amount'),
    admin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin
      .from('shopper_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }),
    admin.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.amount), 0) ?? 0

  return {
    totalRevenue,
    activeRequests: activeRequests ?? 0,
    newShoppers: newShoppers ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    totalShoppers: totalShoppers ?? 0,
    pendingPayments: pendingPayments ?? 0,
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
