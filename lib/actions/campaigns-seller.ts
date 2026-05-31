'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SellerProductOption = {
  id: string
  name: string
  price: number
  stock: number
}

async function requireVerifiedShopper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('shopper_profiles')
    .select('verification_status')
    .eq('id', user.id)
    .single()

  if (profile?.verification_status !== 'verified') {
    throw new Error('You must be a verified seller to join campaigns.')
  }

  return { supabase, userId: user.id }
}

export async function getSellerCampaignProducts(promotionId: string): Promise<SellerProductOption[]> {
  const { supabase, userId } = await requireVerifiedShopper()

  const { data: existing } = await supabase
    .from('promotion_products')
    .select('product_id')
    .eq('promotion_id', promotionId)
    .eq('shopper_id', userId)

  const existingIds = new Set((existing ?? []).map((e) => e.product_id))

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price, stock')
    .eq('shopper_id', userId)
    .eq('is_available', true)
    .eq('approval_status', 'approved')
    .order('name')

  if (error) throw new Error(error.message)

  return (products ?? [])
    .filter((p) => !existingIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.stock,
    }))
}

export async function submitCampaignProduct(
  promotionId: string,
  productId: string,
  specialPrice: number
): Promise<{ error?: string; success?: string }> {
  const { supabase, userId } = await requireVerifiedShopper()

  if (!productId || !specialPrice || specialPrice <= 0) {
    return { error: 'Product and a valid special price are required.' }
  }

  const [{ data: campaign }, { data: product }] = await Promise.all([
    supabase.from('promotions').select('discount_percentage, status, type').eq('id', promotionId).single(),
    supabase.from('products').select('id, price, shopper_id').eq('id', productId).single(),
  ])

  if (!campaign || campaign.type !== 'flash_sale_campaign') {
    return { error: 'Campaign not found.' }
  }
  if (!['upcoming', 'active'].includes(campaign.status)) {
    return { error: 'This campaign is no longer accepting submissions.' }
  }
  if (!product || product.shopper_id !== userId) {
    return { error: 'Product not found or not owned by you.' }
  }

  const basePrice = Number(product.price)
  if (specialPrice >= basePrice) {
    return { error: 'Special price must be lower than the regular price.' }
  }

  const minDiscount = Number(campaign.discount_percentage ?? 0)
  if (minDiscount > 0) {
    const discountPct = ((basePrice - specialPrice) / basePrice) * 100
    if (discountPct < minDiscount) {
      return { error: `Minimum discount is ${minDiscount}%. Your price gives ${Math.round(discountPct)}% off.` }
    }
  }

  const { error } = await supabase.from('promotion_products').insert({
    promotion_id: promotionId,
    product_id: productId,
    shopper_id: userId,
    special_price: specialPrice,
    status: 'pending',
  } as any)

  if (error) {
    if (error.code === '23505') return { error: 'This product is already submitted for this campaign.' }
    return { error: error.message }
  }

  const { data: promo } = await supabase
    .from('promotions')
    .select('name')
    .eq('id', promotionId)
    .single()

  // Best-effort confirmation (ignored if notifications RLS blocks seller insert)
  await supabase.from('notifications' as any).insert({
    user_id: userId,
    title: 'Campaign submission sent',
    message: `Your product is pending admin approval for "${promo?.name ?? 'the campaign'}".`,
    type: 'campaign_submitted',
    is_read: false,
  })

  revalidatePath('/dashboard/campaigns')
  revalidatePath('/dashboard/notifications')
  return { success: 'Product submitted for review.' }
}

export async function withdrawCampaignProduct(
  promotionId: string,
  productId: string
): Promise<{ error?: string; success?: string }> {
  const { supabase, userId } = await requireVerifiedShopper()

  const { error } = await supabase
    .from('promotion_products')
    .delete()
    .eq('promotion_id', promotionId)
    .eq('product_id', productId)
    .eq('shopper_id', userId)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/campaigns')
  return { success: 'Submission withdrawn.' }
}
