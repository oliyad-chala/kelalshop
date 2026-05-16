'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/types/app.types'

export async function sendMessage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const order_id = formData.get('order_id') as string
  const content = formData.get('content') as string
  const file = formData.get('image') as File | null

  if (!order_id) return { error: 'Order ID is missing.' }
  if ((!content || !content.trim()) && (!file || file.size === 0)) {
    return { error: 'Message cannot be empty.' }
  }

  // Look up the order to resolve recipient_id.
  // The recipient is whichever participant is NOT the current user.
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('buyer_id, shopper_id')
    .eq('id', order_id)
    .single()

  if (orderError || !order) return { error: 'Order not found.' }

  // Verify the current user is actually a participant
  if (order.buyer_id !== user.id && order.shopper_id !== user.id) {
    return { error: 'You are not a participant in this order.' }
  }

  const recipient_id = order.buyer_id === user.id ? order.shopper_id : order.buyer_id

  let image_url = null

  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'Image exceeds 5 MB limit.' }
    }
    const fileExt = file.name.split('.').pop()
    const fileName = `${order_id}/${crypto.randomUUID()}.${fileExt}`
    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('messages')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) return { error: `Upload failed: ${uploadError.message}` }

    const { data: urlData } = supabase.storage
      .from('messages')
      .getPublicUrl(fileName)

    image_url = urlData.publicUrl
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      order_id,
      sender_id: user.id,
      recipient_id,
      content: content?.trim() || 'Sent an attachment',
      image_url,
    })

  if (error) return { error: error.message }

  // Revalidate both the chat room and the chat list (unread badge)
  revalidatePath(`/dashboard/chat/${order_id}`)
  revalidatePath('/dashboard/chat')

  return { success: 'Sent' }
}

/**
 * Mark all unread messages in a given order's chat as read for the current user.
 * Called when a user opens a chat room.
 *
 * NOTE: No revalidatePath here — this is called during a page render, and
 * Next.js 16 disallows revalidation during rendering. The chat list is a
 * fully dynamic route, so it always reads fresh data on navigation anyway.
 */
export async function markMessagesRead(orderId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('order_id', orderId)
    .eq('recipient_id', user.id)
    .eq('is_read', false)
}

/**
 * Send a direct message to another user (no order required).
 * Used by the "Message Shopper" button on product pages.
 */
export async function sendDirectMessage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const recipient_id = formData.get('recipient_id') as string
  const content = formData.get('content') as string

  if (!recipient_id) return { error: 'Recipient is missing.' }
  if (!content?.trim()) return { error: 'Message cannot be empty.' }

  // Prevent messaging yourself
  if (recipient_id === user.id) return { error: 'You cannot message yourself.' }

  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id,
      content: content.trim(),
      // order_id and request_id are intentionally null for direct messages
    })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/chat/dm/${recipient_id}`)
  revalidatePath('/dashboard/chat')

  return { success: 'Sent' }
}

/**
 * Mark all unread direct messages from a specific sender as read.
 */
export async function markDirectMessagesRead(senderId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ is_read: true })
    .is('order_id', null)
    .eq('sender_id', senderId)
    .eq('recipient_id', user.id)
    .eq('is_read', false)
}
