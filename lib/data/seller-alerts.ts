import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const CAMPAIGN_NOTIFICATION_TYPES = [
  'campaign_invite',
  'campaign_approved',
  'campaign_rejected',
  'campaign_force_added',
] as const

export type SellerInboxCounts = {
  unreadNotifications: number
  unreadMessages: number
  unreadCampaigns: number
  unreadMessageNotifs: number
}

/** Avoid double-counting when a chat also has a new_message notification row. */
export function totalInboxCount(c: SellerInboxCounts): number {
  const notifsExcludingMessageDupes = Math.max(0, c.unreadNotifications - c.unreadMessageNotifs)
  return notifsExcludingMessageDupes + c.unreadMessages
}

export async function getSellerInboxCounts(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SellerInboxCounts> {
  const [
    { count: unreadNotifications },
    { count: unreadMessages },
    { count: unreadCampaigns },
    { count: unreadMessageNotifs },
  ] = await Promise.all([
    supabase
      .from('notifications' as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false),
    supabase
      .from('notifications' as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .in('type', [...CAMPAIGN_NOTIFICATION_TYPES]),
    supabase
      .from('notifications' as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('type', 'new_message'),
  ])

  return {
    unreadNotifications: unreadNotifications ?? 0,
    unreadMessages: unreadMessages ?? 0,
    unreadCampaigns: unreadCampaigns ?? 0,
    unreadMessageNotifs: unreadMessageNotifs ?? 0,
  }
}

export { CAMPAIGN_NOTIFICATION_TYPES }
