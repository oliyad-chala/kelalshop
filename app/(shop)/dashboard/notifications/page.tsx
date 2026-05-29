import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { markNotificationsAsRead } from '@/lib/actions/notifications'
import { formatDistanceToNow } from 'date-fns'

export const metadata = {
  title: 'Notifications | KelalShop',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: notifications } = await supabase
    .from('notifications' as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all as read when page is visited
  const hasUnread = notifications?.some(n => !n.is_read)
  if (hasUnread) {
    await markNotificationsAsRead()
  }

  return (
    <div className="max-w-3xl fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight mb-2">Notifications</h1>
        <p className="text-slate-500">
          Stay updated on your product approvals, messages, and account alerts.
        </p>
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-navy-900 mb-2">You're all caught up</h3>
          <p className="text-slate-500">You have no new notifications right now.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n: any) => (
            <div 
              key={n.id} 
              className={`p-4 sm:p-6 transition-colors ${!n.is_read ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}`}
            >
              <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                  n.type === 'product_approved' ? 'bg-emerald-100 text-emerald-600' :
                  n.type === 'product_rejected' ? 'bg-red-100 text-red-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {n.type === 'product_approved' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                  {n.type === 'product_rejected' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                  {!['product_approved', 'product_rejected'].includes(n.type) && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold text-navy-900">{n.title}</h4>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
