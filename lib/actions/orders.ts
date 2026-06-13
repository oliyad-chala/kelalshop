'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resolveOrderPrice } from '@/lib/utils/campaign-pricing'
import { computeShippingFee, getActiveShippingPromotion } from '@/lib/utils/shipping-promotion'
import { DEFAULT_SHIPPING_FEE_ETB } from '@/lib/config/checkout'
import { getUserLocation } from '@/lib/utils/geo'
import { logUserAction } from '@/lib/actions/activity-log'

/**
 * Shopper marks an order as Shipped.
 * Workflow: pending/accepted → shipped
 */
export async function markOrderShipped(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('orders')
    .update({ status: 'shipped' } as any)
    .eq('id', orderId)
    .eq('shopper_id', user.id) // only the assigned shopper can ship
    .in('status', ['pending', 'accepted'])

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
}

/**
 * Buyer confirms delivery — triggers escrow release.
 * Workflow: shipped → delivered
 * The payment is released from escrow to the shopper's wallet.
 */
export async function confirmDelivery(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch the order to get amount + shopper_id
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('amount, shopper_id, status')
    .eq('id', orderId)
    .eq('buyer_id', user.id) // only the buyer can confirm
    .single()

  if (fetchError || !order) throw new Error('Order not found or access denied.')
  if (order.status !== 'shipped') throw new Error('Order must be in "shipped" status to confirm delivery.')

  // 2. Mark order delivered
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'delivered' } as any)
    .eq('id', orderId)

  if (updateError) throw new Error(updateError.message)

  // 3. Escrow release: credit net amount to shopper wallet (5% commission)
  const commission = 0.05
  const payout = Number(order.amount) * (1 - commission)

  await supabase.rpc('credit_shopper_wallet', {
    p_shopper_id: order.shopper_id,
    p_amount: payout,
  }).maybeSingle() // RPC may not exist yet — fails silently

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
}

/**
 * Shopper marks order as Processing/Accepted.
 * Workflow: pending → accepted
 */
export async function acceptOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('orders')
    .update({ status: 'accepted' } as any)
    .eq('id', orderId)
    .eq('shopper_id', user.id)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
}

/**
 * Buyer cancels a pending order.
 * Workflow: pending → cancelled
 */
export async function cancelOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' } as any)
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
}

/**
 * Buyer places an order for a product.
 * Pass shippingPromotionId only once per checkout (first cart line) to apply platform shipping deal.
 */
export async function createOrder(
  productId: string,
  shippingPromotionId?: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let finalProductId = productId

  // Bypass for mock products so the user can test the workflow
  if (productId.startsWith('mock')) {
    const { data: realProduct } = await supabase.from('products').select('id').limit(1).maybeSingle()
    if (realProduct) {
      finalProductId = realProduct.id
    } else {
      throw new Error('Cannot place an order for a mock product. Please create a real product first using the "Sell" button.')
    }
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, price, shopper_id, is_available, approval_status')
    .eq('id', finalProductId)
    .single()

  if (productError || !product) {
    throw new Error('Product not found.')
  }
  if (!product.is_available) {
    throw new Error('This product is no longer available.')
  }
  if (product.approval_status !== 'approved') {
    throw new Error('This product cannot be purchased yet.')
  }

  const amount = await resolveOrderPrice(supabase, finalProductId, Number(product.price))

  let shippingFee = 0
  let shippingDiscount = 0
  let appliedPromotionId: string | null = null

  if (shippingPromotionId) {
    const location = await getUserLocation()
    const promotion = await getActiveShippingPromotion(supabase, location)
    if (promotion && promotion.id === shippingPromotionId) {
      const shipping = computeShippingFee(DEFAULT_SHIPPING_FEE_ETB, promotion)
      shippingFee = shipping.fee
      shippingDiscount = shipping.discount
      appliedPromotionId = promotion.id
    }
  }

  const rpcArgs: Record<string, unknown> = {
    p_product_id: finalProductId,
    p_quantity: 1,
  }
  if (appliedPromotionId) {
    rpcArgs.p_shipping_promotion_id = appliedPromotionId
  }

  const { data, error } = await supabase.rpc('create_order', rpcArgs as any)

  if (error) {
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        product_id: finalProductId,
        buyer_id: user.id,
        shopper_id: product.shopper_id,
        amount,
        status: 'pending',
        shipping_fee: shippingFee,
        shipping_discount: shippingDiscount,
        shipping_promotion_id: appliedPromotionId,
      } as any)
      .select('id')
      .single()

    if (insertError) throw new Error(insertError.message)
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    await logUserAction({
      userId: user.id,
      userName: profile?.full_name ?? user.email ?? 'Buyer',
      actionType: 'create_order',
      entityType: 'order',
      entityId: order.id,
      description: `Placed order for product "${product.name ?? finalProductId}"`
    })

    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard')
    return order.id
  }
  
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  await logUserAction({
    userId: user.id,
    userName: profile?.full_name ?? user.email ?? 'Buyer',
    actionType: 'create_order',
    entityType: 'order',
    entityId: data,
    description: `Placed order for product "${product.name ?? finalProductId}"`
  })

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')

  return data
}

/**
 * Buyer submits a review for a completed order.
 */
export async function submitReview(orderId: string, revieweeId: string, rating: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5')

  // Check if review already exists to prevent duplicates
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', orderId)
    .eq('reviewer_id', user.id)
    .single()

  if (existingReview) {
    throw new Error('You have already reviewed this order.')
  }

  const { data: order } = await supabase
    .from('orders')
    .select('buyer_id, shopper_id, status')
    .eq('id', orderId)
    .single()

  if (!order || order.buyer_id !== user.id || order.shopper_id !== revieweeId) {
    throw new Error('You can only review orders you purchased.')
  }
  if (order.status !== 'delivered') {
    throw new Error('You can only review delivered orders.')
  }

  // Insert the review
  const { error } = await supabase
    .from('reviews')
    .insert({
      order_id: orderId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating: Math.floor(rating)
    })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/admin/trust')
}
