'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'

export type NotificationRow = {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export type MessagePreview = {
  id: string
  content: string
  created_at: string
  sender_id: string
  order_id: string | null
  sender_name: string
}

type Filter = 'all' | 'campaigns' | 'products' | 'messages'

const CAMPAIGN_TYPES = new Set([
  'campaign_invite',
  'campaign_approved',
  'campaign_rejected',
  'campaign_force_added',
])

const PRODUCT_TYPES = new Set(['product_approved', 'product_rejected'])

function notificationCategory(type: string): Filter {
  if (CAMPAIGN_TYPES.has(type)) return 'campaigns'
  if (type === 'product_approved' || type === 'product_rejected') return 'products'
  if (type === 'new_message') return 'messages'
  return 'all'
}

function notificationHref(type: string): string | null {
  if (CAMPAIGN_TYPES.has(type)) return '/dashboard/campaigns'
  if (type === 'product_approved' || type === 'product_rejected') return '/dashboard/listings'
  if (type === 'new_message') return '/dashboard/chat'
  return null
}

function NotificationIcon({ type }: { type: string }) {
  const base = 'w-10 h-10 rounded-full shrink-0 flex items-center justify-center'
  if (type === 'product_approved' || type === 'campaign_approved') {
    return (
      <div className={clsx(base, 'bg-emerald-100 text-emerald-600')}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (type === 'product_rejected' || type === 'campaign_rejected') {
    return (
      <div className={clsx(base, 'bg-red-100 text-red-600')}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    )
  }
  if (type === 'campaign_invite') {
    return <div className={clsx(base, 'bg-amber-100 text-amber-600')}>⚡</div>
  }
  if (type === 'new_message') {
    return (
      <div className={clsx(base, 'bg-blue-100 text-blue-600')}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
    )
  }
  return (
    <div className={clsx(base, 'bg-slate-100 text-slate-600')}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}

function NotificationItem({ n }: { n: NotificationRow }) {
  const href = notificationHref(n.type)
  const inner = (
    <div className={clsx('p-4 sm:p-6 transition-colors flex gap-4 items-start', !n.is_read && 'bg-amber-50/50', href && 'hover:bg-slate-50/80')}>
      <NotificationIcon type={n.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-bold text-navy-900">{n.title}</h4>
          <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
        {href && (
          <p className="text-xs text-amber-600 font-semibold mt-2">View details →</p>
        )}
      </div>
      {!n.is_read && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />}
    </div>
  )

  if (href) {
    return (
      <Link key={n.id} href={href} className="block border-b border-slate-100 last:border-0">
        {inner}
      </Link>
    )
  }

  return (
    <div key={n.id} className="border-b border-slate-100 last:border-0">
      {inner}
    </div>
  )
}

function MessageItem({ m }: { m: MessagePreview }) {
  const href = m.order_id ? `/dashboard/chat/${m.order_id}` : `/dashboard/chat/dm/${m.sender_id}`
  return (
    <Link
      href={href}
      className="block p-4 sm:p-6 border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors"
    >
      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 shrink-0 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-bold text-navy-900">Message from {m.sender_name}</h4>
            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">{m.content}</p>
          <p className="text-xs text-blue-600 font-semibold mt-2">Open chat →</p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
      </div>
    </Link>
  )
}

export function NotificationsInbox({
  notifications,
  unreadMessages,
}: {
  notifications: NotificationRow[]
  unreadMessages: MessagePreview[]
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const campaignCount = notifications.filter((n) => CAMPAIGN_TYPES.has(n.type)).length
  const productCount = notifications.filter((n) => PRODUCT_TYPES.has(n.type) && n.type !== 'new_message').length
  const messageNotifCount = notifications.filter((n) => n.type === 'new_message').length

  const filteredNotifications = useMemo(() => {
    if (filter === 'messages') return []
    if (filter === 'all') return notifications
    return notifications.filter((n) => notificationCategory(n.type) === filter)
  }, [notifications, filter])

  const showMessages = filter === 'all' || filter === 'messages'
  const isEmpty =
    filteredNotifications.length === 0 && (!showMessages || unreadMessages.length === 0)

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: notifications.length + unreadMessages.length },
    { id: 'campaigns', label: 'Campaigns', count: campaignCount },
    { id: 'products', label: 'Products', count: productCount },
    { id: 'messages', label: 'Messages', count: unreadMessages.length + messageNotifCount },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
              filter === chip.id
                ? 'bg-amber-500 text-navy-950'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'
            )}
          >
            {chip.label}
            {chip.count > 0 && (
              <span className="ml-1.5 opacity-80">({chip.count > 99 ? '99+' : chip.count})</span>
            )}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <h3 className="text-lg font-bold text-navy-900 mb-2">You&apos;re all caught up</h3>
          <p className="text-slate-500">No alerts in this category right now.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filteredNotifications.map((n) => (
            <NotificationItem key={n.id} n={n} />
          ))}
          {showMessages && unreadMessages.map((m) => (
            <MessageItem key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  )
}
