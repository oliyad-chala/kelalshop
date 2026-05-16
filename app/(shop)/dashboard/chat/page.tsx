import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils/formatters'

export const metadata = {
  title: 'Messages | KelalShop',
}

export default async function ChatListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isShopper = profile?.role === 'shopper'

  // Fetch orders where this user is involved, with messages
  let query = supabase
    .from('orders')
    .select('*, products(name), buyer:buyer_id(*), shopper:shopper_id(*), messages(id, created_at, content, is_read, recipient_id)')

  if (isShopper) {
    query = query.eq('shopper_id', user.id)
  } else {
    query = query.eq('buyer_id', user.id)
  }

  const { data: orders } = await query

  // Process order chats
  let activeChats = (orders || []).map(order => {
    const msgs = (order.messages as any[]) || []
    const sorted = [...msgs].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastMessage = sorted[0] ?? null
    const unreadCount = msgs.filter(
      m => m.recipient_id === user.id && m.is_read === false
    ).length

    return {
      ...order,
      otherParty: isShopper ? order.buyer : order.shopper,
      lastMessage,
      unreadCount,
      isDirectMessage: false,
    }
  })

  // Fetch direct messages (where order_id is null)
  const { data: dmData } = await supabase
    .from('messages')
    .select('*, sender:sender_id(*), recipient:recipient_id(*)')
    .is('order_id', null)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)

  // Group direct messages by conversation partner
  const dmChatsMap = new Map()
  if (dmData) {
    for (const msg of dmData) {
      const partner = msg.sender_id === user.id ? msg.recipient : msg.sender
      if (!partner) continue

      const partnerId = partner.id
      if (!dmChatsMap.has(partnerId)) {
        dmChatsMap.set(partnerId, {
          id: partnerId, // Use partnerId as the chat ID for routing to /dashboard/chat/dm/[id]
          isDirectMessage: true,
          otherParty: partner,
          messages: [],
          created_at: msg.created_at,
        })
      }
      dmChatsMap.get(partnerId).messages.push(msg)
    }
  }

  const dmChats = Array.from(dmChatsMap.values()).map(chat => {
    const sorted = [...chat.messages].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastMessage = sorted[0] ?? null
    const unreadCount = chat.messages.filter(
      (m: any) => m.recipient_id === user.id && m.is_read === false
    ).length

    return {
      ...chat,
      lastMessage,
      unreadCount
    }
  })

  // Combine order chats and direct message chats
  activeChats = [...activeChats, ...dmChats]

  // Sort by latest message timestamp, then chat creation
  activeChats.sort((a, b) => {
    const tA = a.lastMessage
      ? new Date(a.lastMessage.created_at).getTime()
      : new Date(a.created_at).getTime()
    const tB = b.lastMessage
      ? new Date(b.lastMessage.created_at).getTime()
      : new Date(b.created_at).getTime()
    return tB - tA
  })

  const totalUnread = activeChats.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="max-w-4xl space-y-6 fade-in">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
            Messages
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1">Communicate regarding your active orders.</p>
        </div>
      </div>

      {!activeChats || activeChats.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">No active chats</h3>
          <p className="text-slate-500">Messages will appear here when you have an active order.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
          {activeChats.map(chat => (
            <Link
              key={chat.id}
              href={chat.isDirectMessage ? `/dashboard/chat/dm/${chat.id}` : `/dashboard/chat/${chat.id}`}
              className="block hover:bg-slate-50/60 transition-colors p-4 sm:p-5 group"
            >
              <div className="flex items-center gap-4">
                {/* Avatar with online-style unread indicator */}
                <div className="relative shrink-0">
                  <Avatar
                    src={chat.otherParty?.avatar_url}
                    name={chat.otherParty?.full_name}
                    size="lg"
                  />
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className={`font-semibold truncate transition-colors group-hover:text-amber-600 ${chat.unreadCount > 0 ? 'text-navy-900' : 'text-slate-700'}`}>
                      {chat.otherParty?.full_name}
                    </h3>
                    <span className={`text-xs shrink-0 ${chat.unreadCount > 0 ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                      {chat.lastMessage
                        ? formatRelativeTime(chat.lastMessage.created_at)
                        : formatRelativeTime(chat.created_at)}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-amber-600 mb-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {chat.isDirectMessage ? 'Direct Message' : (chat.products ? chat.products.name : 'Custom Request Order')}
                  </div>

                  <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-semibold text-navy-900' : 'text-slate-500'}`}>
                    {chat.lastMessage ? chat.lastMessage.content : <em className="font-normal">No messages yet</em>}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
