'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SubmitReviewInput {
  shopperId: string
  productId?: string | null
  rating: number
  comment?: string | null
  channel?: 'phone' | 'telegram' | 'in_app_chat' | 'order' | 'in_person' | 'other'
  tags?: string[]
}

/**
 * Submit a review for a shopper, including direct sales made via phone call, Telegram, or DM.
 */
export async function submitDirectSaleReview(input: SubmitReviewInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please log in to submit a rating.' }
  }

  const rating = Math.round(Number(input.rating))
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be between 1 and 5 stars.' }
  }

  if (user.id === input.shopperId) {
    return { error: 'You cannot rate your own shop.' }
  }

  const admin = createAdminClient()

  // Verify the shopper profile exists
  const { data: shopperProfile } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('id', input.shopperId)
    .maybeSingle()

  if (!shopperProfile) {
    return { error: 'Shopper not found.' }
  }

  // Prevent spam: Check if this user already reviewed this product
  if (input.productId) {
    const { data: existingProdReview } = await admin
      .from('reviews')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('product_id', input.productId)
      .maybeSingle()

    if (existingProdReview) {
      return { error: 'You have already reviewed this product.' }
    }
  } else {
    // If no specific product, check if user reviewed this shopper in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentReview } = await admin
      .from('reviews')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('reviewee_id', input.shopperId)
      .gte('created_at', sevenDaysAgo)
      .maybeSingle()

    if (recentReview) {
      return { error: 'You have recently reviewed this shopper. You can submit another review after 7 days.' }
    }
  }

  // Insert review into reviews table
  const { data: newReview, error: insertError } = await admin
    .from('reviews')
    .insert({
      reviewer_id: user.id,
      reviewee_id: input.shopperId,
      product_id: input.productId || null,
      rating,
      comment: input.comment?.trim() || null,
      channel: input.channel || 'phone',
      tags: Array.isArray(input.tags) ? input.tags : [],
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error submitting review:', insertError)
    return { error: insertError.message || 'Failed to submit review.' }
  }

  // Manually ensure trust_score is updated on shopper profile in case trigger is pending
  try {
    const { data: avgData } = await admin
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', input.shopperId)

    if (avgData && avgData.length > 0) {
      const avg = avgData.reduce((acc, r) => acc + (r.rating || 0), 0) / avgData.length
      const trustScore = Math.round(avg * 20) // 5 stars = 100 trust score
      await admin
        .from('profiles')
        .update({ trust_score: trustScore })
        .eq('id', input.shopperId)
    }
  } catch (err) {
    console.warn('Could not re-calculate trust score directly:', err)
  }

  // Revalidate relevant cached views
  revalidatePath('/')
  revalidatePath('/products')
  if (input.productId) {
    revalidatePath(`/products/${input.productId}`)
  }
  revalidatePath(`/shoppers/${input.shopperId}`)
  revalidatePath('/dashboard/chat')
  revalidatePath('/admin/trust')

  return { success: true, reviewId: newReview.id }
}

/**
 * Fetch reviews for a shopper
 */
export async function getShopperReviews(shopperId: string, limit = 10) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      channel,
      tags,
      created_at,
      reviewer:profiles!reviewer_id(id, full_name, avatar_url),
      product:products(id, name)
    `)
    .eq('reviewee_id', shopperId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching shopper reviews:', error)
    return []
  }

  return data || []
}

/**
 * Check if the current user has already reviewed this product or shopper
 */
export async function checkUserReviewStatus(shopperId: string, productId?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { canReview: false, reason: 'not_logged_in' }
  if (user.id === shopperId) return { canReview: false, reason: 'is_self' }

  const admin = createAdminClient()

  if (productId) {
    const { data: existing } = await admin
      .from('reviews')
      .select('id, rating')
      .eq('reviewer_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()

    if (existing) {
      return { canReview: false, reason: 'already_reviewed', existingRating: existing.rating }
    }
  }

  return { canReview: true }
}

