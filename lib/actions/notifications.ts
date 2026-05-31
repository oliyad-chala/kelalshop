'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markNotificationsAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications' as any)
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard')
}

/** Mark campaign invitation alerts as read when seller dismisses messages. */
export async function markCampaignInvitesAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications' as any)
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .in('type', ['campaign_invite', 'campaign_approved', 'campaign_rejected', 'campaign_force_added'])

  revalidatePath('/dashboard/campaigns')
  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard')
}
