'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, requireStaffOrAdmin } from '@/lib/actions/admin-access'
import { uploadWatermarkedProductImages } from '@/lib/utils/product-image-storage'

// ── Verifications ────────────────────────────────────────────────────────────

export async function approveVerification(shopperId: string) {
  const { adminClient: admin } = await requireStaffOrAdmin()
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
  const { adminClient: admin } = await requireStaffOrAdmin()
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
  const { adminClient: admin } = await requireAdmin()

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
  const { adminClient: admin } = await requireAdmin()
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
  const { adminClient: admin } = await requireAdmin()

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
  const { adminClient: admin } = await requireAdmin()

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
  const { adminClient: admin } = await requireStaffOrAdmin()
  const { error } = await admin
    .from('products')
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() } as any)
    .eq('id', productId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function adminToggleProductBoost(productId: string, boost: boolean) {
  const { adminClient: admin } = await requireAdmin()

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
  const { adminClient: admin } = await requireStaffOrAdmin()

  const [
    { data: orders },
    { count: activeRequests },
    { count: newShoppers },
    { count: pendingVerifications },
    { count: totalShoppers },
    { count: totalBuyers },
    { count: pendingPayments },
    { count: pendingProducts },
  ] = await Promise.all([
    admin.from('orders').select('amount'),
    admin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin
      .from('shopper_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
    admin.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('products').select('*', { count: 'exact', head: true }).eq('approval_status' as any, 'pending'),
  ])

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.amount), 0) ?? 0

  return {
    totalRevenue,
    activeRequests: activeRequests ?? 0,
    newShoppers: newShoppers ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    totalShoppers: totalShoppers ?? 0,
    totalBuyers: totalBuyers ?? 0,
    pendingPayments: pendingPayments ?? 0,
    pendingProducts: pendingProducts ?? 0,
  }
}

export async function getOrderVolumeChart() {
  const { adminClient: admin } = await requireStaffOrAdmin()
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
  const { adminClient: admin } = await requireStaffOrAdmin()
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

export async function getTopSellersChart() {
  const { adminClient: admin } = await requireStaffOrAdmin()
  const { data: orders } = await admin
    .from('orders')
    .select('amount, shopper_id, shopper:profiles!orders_shopper_id_fkey(full_name)')
    .eq('status', 'delivered')

  if (!orders) return []

  const revenueBySeller: Record<string, { name: string; revenue: number }> = {}
  for (const o of orders as any[]) {
    const sId = o.shopper_id
    if (!revenueBySeller[sId]) {
      revenueBySeller[sId] = { name: o.shopper?.full_name ?? 'Unknown', revenue: 0 }
    }
    revenueBySeller[sId].revenue += Number(o.amount)
  }

  return Object.values(revenueBySeller)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function adminUpdateOrderStatus(orderId: string, status: string) {
  const { adminClient: admin } = await requireStaffOrAdmin()
  const { error } = await admin
    .from('orders')
    .update({
      status: status,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', orderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/orders')
}

export async function adminDeleteProduct(productId: string) {
  const { adminClient: admin } = await requireStaffOrAdmin()

  // Professional delete: clean up related data first
  // 1. Delete product images from storage
  const { data: images } = await admin
    .from('product_images')
    .select('url')
    .eq('product_id', productId)

  if (images && images.length > 0) {
    const fileNames = images.map((img: any) => {
      const urlParts = img.url.split('/')
      const fileName = urlParts.pop()
      const folderName = urlParts.pop() // this should be productId
      return `${folderName}/${fileName}`
    })
    await admin.storage.from('products').remove(fileNames)
  }

  // 2. Delete related records in other tables
  await Promise.all([
    admin.from('product_images').delete().eq('product_id', productId),
    admin.from('cart_items').delete().eq('product_id', productId),
    admin.from('wishlist_items').delete().eq('product_id', productId),
    admin.from('flash_deal_items').delete().eq('product_id', productId),
    admin.from('orders').delete().eq('product_id', productId),
  ])

  // 3. Delete the product itself
  const { error } = await admin
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/products')
  revalidatePath('/dashboard/listings')
  revalidatePath('/')
}

export async function adminUpdateProduct(
  productId: string,
  _prevState: any,
  formData: FormData
) {
  const { adminClient: admin } = await requireStaffOrAdmin()

  const rawName = formData.get('name') as string
  const customName = formData.get('custom_name') as string | null
  const description = formData.get('description') as string
  const price = Number(formData.get('price'))
  const stock = Number(formData.get('stock') ?? 1)
  const category_id = formData.get('category_id') as string | null
  const location = formData.get('location') as string | null

  const name = customName?.trim() || rawName

  if (!name || isNaN(price) || price < 0) {
    return { error: 'Please provide a valid name and price.' }
  }

  const attributes: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (key.startsWith('attr_') && value) {
      const cleanKey = key.replace('attr_', '')
      attributes[cleanKey] = value.toString().trim()
    }
  })

  // Check images
  const imageFiles = formData.getAll('images') as File[]
  const validImages = imageFiles.filter(f => f && f.size > 0)

  if (validImages.length > 3) {
    return { error: 'You can upload a maximum of 3 photos.' }
  }

  const MAX_BYTES = 5 * 1024 * 1024
  const oversized = validImages.find(f => f.size > MAX_BYTES)
  if (oversized) {
    return { error: `"${oversized.name}" exceeds the 5 MB limit per image.` }
  }

  // Update product details
  const { error: updateError } = await admin
    .from('products')
    .update({
      name,
      description,
      price,
      stock,
      category_id: category_id || null,
      location: location?.trim() || null,
      attributes,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', productId)

  if (updateError) return { error: updateError.message }

  // If new images provided, replace old ones
  if (validImages.length > 0) {
    await admin.from('product_images').delete().eq('product_id', productId)

    await uploadWatermarkedProductImages(admin, productId, validImages)
  }

  revalidatePath('/admin/products')
  revalidatePath('/dashboard/listings')
  revalidatePath('/')

  return { success: 'Product updated successfully.' }
}

export async function adminApproveProduct(productId: string) {
  const { adminClient: admin } = await requireStaffOrAdmin()
  const { error } = await admin
    .from('products')
    .update({ approval_status: 'approved', updated_at: new Date().toISOString() } as any)
    .eq('id', productId)
    
  if (error) throw new Error(error.message)

  // create notification
  const { data: product } = await admin.from('products').select('shopper_id, name').eq('id', productId).single()
  if (product) {
    await admin.from('notifications' as any).insert({
      user_id: product.shopper_id,
      title: 'Product Approved',
      message: `Your product "${product.name}" has been approved and is now visible.`,
      type: 'product_approved',
      is_read: false
    })
  }

  revalidatePath('/admin/products')
  revalidatePath('/dashboard/listings')
  revalidatePath('/')
}

export async function adminRejectProduct(productId: string, reason: string) {
  const { adminClient: admin } = await requireStaffOrAdmin()
  const { error } = await admin
    .from('products')
    .update({ 
      approval_status: 'rejected', 
      approval_notes: reason,
      updated_at: new Date().toISOString() 
    } as any)
    .eq('id', productId)
    
  if (error) throw new Error(error.message)

  // create notification
  const { data: product } = await admin.from('products').select('shopper_id, name').eq('id', productId).single()
  if (product) {
    await admin.from('notifications' as any).insert({
      user_id: product.shopper_id,
      title: 'Product Rejected',
      message: `Your product "${product.name}" was rejected. Reason: ${reason}`,
      type: 'product_rejected',
      is_read: false
    })
  }

  revalidatePath('/admin/products')
  revalidatePath('/dashboard/listings')
  revalidatePath('/')
}
