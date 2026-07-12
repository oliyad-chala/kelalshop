'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { toggleUserSuspend } from '@/lib/actions/admin-users'
import { revalidatePath } from 'next/cache'

export async function suspendUser(userId: string, isSuspended: boolean) {
  try {
    await toggleUserSuspend(userId, isSuspended)
    revalidatePath('/admin/notifications')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to suspend user' }
  }
}

export async function getSupportInbox() {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) return { error: 'Not authenticated' }

  // Fetch all messages where adminUser is recipient
  const { data: messages, error } = await (supabase
    .from('messages') as any)
    .select(`
      id,
      sender_id,
      content,
      created_at,
      is_read,
      sender:profiles!messages_sender_id_fkey(id, full_name, role, avatar_url)
    `)
    .eq('recipient_id', adminUser.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching support inbox:', error)
    return { error: error.message }
  }

  // Group by sender_id and build the conversations list
  const conversationMap = new Map<string, any>()
  
  for (const msg of (messages ?? [])) {
    const sender = msg.sender
    if (!sender) continue
    
    if (!conversationMap.has(sender.id)) {
      conversationMap.set(sender.id, {
        partner: sender,
        lastMessage: {
          content: msg.content,
          created_at: msg.created_at,
          is_read: msg.is_read,
        },
        unreadCount: 0,
      })
    }
    
    if (!msg.is_read) {
      const convo = conversationMap.get(sender.id)
      convo.unreadCount += 1
    }
  }

  return { conversations: Array.from(conversationMap.values()) }
}

export async function getUserDetailedSupportInfo(userId: string) {
  const admin = createAdminClient()
  
  // 1. Fetch base profile
  const { data: profile, error: pError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  if (pError || !profile) {
    return { error: 'Profile not found' }
  }

  // 2. Fetch auth email & details via service role admin API
  let email = null
  let emailConfirmed = false
  let lastSignIn = null
  try {
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(userId)
    if (authUser) {
      email = authUser.email
      emailConfirmed = !!authUser.email_confirmed_at
      lastSignIn = authUser.last_sign_in_at
    }
  } catch (err) {
    console.error('Error fetching auth user info:', err)
  }

  // 3. Fetch shopper profile if they are a shopper
  let shopperProfile = null
  if (profile.role === 'shopper') {
    const { data: sProfile } = await admin
      .from('shopper_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    shopperProfile = sProfile
  }

  // 4. Fetch order stats
  const { count: buyerOrdersCount } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('buyer_id', userId)

  const { count: shopperOrdersCount } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('shopper_id', userId)

  // 5. Fetch product count
  const { count: productsCount } = await admin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('shopper_id', userId)

  // 6. Fetch reviews average
  const { data: reviews } = await admin
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', userId)
    
  const reviewCount = reviews?.length ?? 0
  const avgRating = reviewCount > 0 
    ? (reviews!.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
    : '0.0'

  return {
    profile,
    email,
    emailConfirmed,
    lastSignIn,
    shopperProfile,
    stats: {
      buyerOrdersCount: buyerOrdersCount ?? 0,
      shopperOrdersCount: shopperOrdersCount ?? 0,
      productsCount: productsCount ?? 0,
      reviewCount,
      avgRating,
    }
  }
}

export async function getConversationMessages(userId: string) {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) return { error: 'Not authenticated' }

  // Fetch messages where:
  // (sender_id = adminUser.id AND recipient_id = userId) OR (sender_id = userId AND recipient_id = adminUser.id)
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      recipient_id,
      content,
      created_at,
      is_read
    `)
    .or(`and(sender_id.eq.${adminUser.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${adminUser.id})`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching conversation:', error)
    return { error: error.message }
  }

  // Also, mark any unread messages from this user to the admin as read!
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', userId)
    .eq('recipient_id', adminUser.id)
    .eq('is_read', false)

  revalidatePath('/admin/notifications')

  return { messages: messages ?? [] }
}

export async function replyToUser(userId: string, content: string) {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) return { error: 'Not authenticated' }

  if (!content.trim()) return { error: 'Message cannot be empty.' }

  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: adminUser.id,
      recipient_id: userId,
      content: content.trim(),
    })

  if (error) {
    console.error('Error sending reply:', error)
    return { error: error.message }
  }

  // Send system notification
  const { data: sender } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', adminUser.id)
    .single()
  const name = sender?.full_name ?? 'Admin'
  const preview = content.length > 120 ? `${content.slice(0, 117)}...` : content

  await supabase.from('notifications' as any).insert({
    user_id: userId,
    type: 'new_message',
    title: `Support reply from ${name}`,
    message: preview,
    is_read: false,
  })

  revalidatePath('/admin/notifications')

  return { success: true }
}
