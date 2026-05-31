'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/actions/admin-access'

// ── Create Campaign ───────────────────────────────────────────────────────────

export async function createCampaign(_prevState: any, formData: FormData) {
  const { adminClient: admin } = await requireAdmin()

  const name             = (formData.get('name') as string)?.trim()
  const type             = (formData.get('type') as string) || 'flash_sale_campaign'
  const start_date       = formData.get('start_date') as string
  const end_date         = formData.get('end_date') as string
  const target_country   = (formData.get('target_country') as string)?.trim() || null
  const target_region    = (formData.get('target_region') as string)?.trim() || null
  const target_city      = (formData.get('target_city') as string)?.trim() || null
  const banner_image_url = (formData.get('banner_image_url') as string)?.trim() || null
  const min_discount_pct = Number(formData.get('min_discount_pct') || 0)
  const description      = (formData.get('description') as string)?.trim() || null

  if (!name || !start_date || !end_date) {
    return { error: 'Name, start date and end date are required.' }
  }
  if (new Date(end_date) <= new Date(start_date)) {
    return { error: 'End date must be after start date.' }
  }

  const now = new Date().toISOString()
  const status = new Date(start_date) > new Date() ? 'upcoming' : 'active'

  const { error } = await admin.from('promotions').insert({
    name,
    type,
    start_date,
    end_date,
    status,
    target_country,
    target_region,
    target_city,
    banner_image_url,
    discount_percentage: min_discount_pct || null,
    description,
    is_active: true,
    created_at: now,
    updated_at: now,
  } as any)

  if (error) return { error: error.message }

  revalidatePath('/admin/promotions')
  redirect('/admin/promotions')
}

// ── Update Campaign Status ────────────────────────────────────────────────────

export async function updateCampaignStatus(campaignId: string, status: 'upcoming' | 'active' | 'ended') {
  const { adminClient: admin } = await requireAdmin()
  const { error } = await admin
    .from('promotions')
    .update({ status, is_active: status !== 'ended', updated_at: new Date().toISOString() } as any)
    .eq('id', campaignId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/promotions')
  revalidatePath(`/admin/promotions/${campaignId}`)
}

// ── Delete Campaign ───────────────────────────────────────────────────────────

export async function deleteCampaign(campaignId: string) {
  const { adminClient: admin } = await requireAdmin()
  const { error } = await admin.from('promotions').delete().eq('id', campaignId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/promotions')
}

// ── Approve / Reject Seller Submissions ──────────────────────────────────────

export async function approveSubmission(promotionId: string, productId: string) {
  const { adminClient: admin } = await requireAdmin()
  const { error } = await admin
    .from('promotion_products')
    .update({ status: 'approved', updated_at: new Date().toISOString() } as any)
    .eq('promotion_id', promotionId)
    .eq('product_id', productId)
  if (error) throw new Error(error.message)

  // Notify seller
  const { data: pp } = await admin
    .from('promotion_products')
    .select('shopper_id, products(name)')
    .eq('promotion_id', promotionId)
    .eq('product_id', productId)
    .single()
  if (pp) {
    await admin.from('notifications' as any).insert({
      user_id: (pp as any).shopper_id,
      title: '🎉 Campaign Submission Approved',
      message: `Your product "${(pp as any).products?.name}" has been approved for the flash sale campaign!`,
      type: 'campaign_approved',
      is_read: false,
    })
  }

  revalidatePath(`/admin/promotions/${promotionId}`)
}

export async function rejectSubmission(promotionId: string, productId: string, reason: string) {
  const { adminClient: admin } = await requireAdmin()
  const { error } = await admin
    .from('promotion_products')
    .update({ status: 'rejected', updated_at: new Date().toISOString() } as any)
    .eq('promotion_id', promotionId)
    .eq('product_id', productId)
  if (error) throw new Error(error.message)

  // Notify seller
  const { data: pp } = await admin
    .from('promotion_products')
    .select('shopper_id, products(name)')
    .eq('promotion_id', promotionId)
    .eq('product_id', productId)
    .single()
  if (pp) {
    await admin.from('notifications' as any).insert({
      user_id: (pp as any).shopper_id,
      title: 'Campaign Submission Rejected',
      message: `Your product "${(pp as any).products?.name}" was not accepted for the campaign. Reason: ${reason}`,
      type: 'campaign_rejected',
      is_read: false,
    })
  }

  revalidatePath(`/admin/promotions/${promotionId}`)
}

// ── Admin Force-Add Product to Campaign ──────────────────────────────────────

export async function adminForceAddProduct(promotionId: string, productId: string, specialPrice: number) {
  const { adminClient: admin } = await requireAdmin()

  // Get product's shopper_id
  const { data: product } = await admin
    .from('products')
    .select('shopper_id, name')
    .eq('id', productId)
    .single()

  if (!product) return { error: 'Product not found.' }

  const { error } = await admin.from('promotion_products').upsert({
    promotion_id: promotionId,
    product_id: productId,
    shopper_id: product.shopper_id,
    special_price: specialPrice,
    status: 'approved', // admin force-adds are auto-approved
    updated_at: new Date().toISOString(),
  } as any, { onConflict: 'promotion_id,product_id' })

  if (error) return { error: error.message }

  // Notify seller
  await admin.from('notifications' as any).insert({
    user_id: product.shopper_id,
    title: '⚡ Your Product Was Added to a Flash Sale!',
    message: `Your product "${product.name}" has been included in an upcoming flash sale campaign by KelalShop.`,
    type: 'campaign_force_added',
    is_read: false,
  })

  revalidatePath(`/admin/promotions/${promotionId}`)
  return { success: 'Product added to campaign successfully.' }
}

// ── Remove product from campaign ─────────────────────────────────────────────

export async function removeProductFromCampaign(promotionId: string, productId: string) {
  const { adminClient: admin } = await requireAdmin()
  const { error } = await admin
    .from('promotion_products')
    .delete()
    .eq('promotion_id', promotionId)
    .eq('product_id', productId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/promotions/${promotionId}`)
}
