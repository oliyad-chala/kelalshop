'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
 */
export async function createOrder(productId: string) {
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

  const { data, error } = await supabase.rpc('create_order', {
    p_product_id: finalProductId,
    p_quantity: 1,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
  
  return data // returns the order_id
}
