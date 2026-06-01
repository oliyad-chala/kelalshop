import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { markNotificationsAsRead } from '@/lib/actions/notifications'
import { NotificationsInbox } from '@/components/dashboard/NotificationsInbox'
import type { MessagePreview, NotificationRow } from '@/components/dashboard/NotificationsInbox'

export const metadata = {
  title: 'Notifications | KelalShop',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: notifications }, { data: messagesRaw }] = await Promise.all([
    supabase
      .from('notifications' as any)
      .select('id, type, title, message, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('messages')
      .select(`
        id, content, created_at, sender_id, order_id, is_read,
        sender:profiles!messages_sender_id_fkey(full_name)
      `)
      .eq('recipient_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const hasUnreadNotifs = notifications?.some((n) => !n.is_read)
  if (hasUnreadNotifs) {
    await markNotificationsAsRead()
  }

  const notificationRows: NotificationRow[] = (notifications ?? []).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: hasUnreadNotifs ? true : n.is_read,
    created_at: n.created_at,
  }))

  const unreadMessages: MessagePreview[] = (messagesRaw ?? []).map((m: any) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    sender_id: m.sender_id,
    order_id: m.order_id,
    sender_name: m.sender?.full_name ?? 'Someone',
  }))

  return (
    <div className="max-w-3xl fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight mb-2">Notifications</h1>
        <p className="text-slate-500">
          Campaign invites, product approvals, and new messages — all in one place.
        </p>
      </div>

      <NotificationsInbox notifications={notificationRows} unreadMessages={unreadMessages} />
    </div>
  )
}
