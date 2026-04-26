import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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

  // Fetch orders where this user is involved
  let query = supabase
    .from('orders')
    .select('*, products(name), buyer:buyer_id(*), shopper:shopper_id(*), messages(created_at, content)')
    
  if (isShopper) {
    query = query.eq('shopper_id', user.id)
  } else {
    query = query.eq('buyer_id', user.id)
  }

  const { data: orders } = await query

  // Process data to sort by latest message
  let activeChats = (orders || []).map(order => {
     // Sort messages descending to get the latest
     const msgs = (order.messages as any[])?.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []
     const lastMessage = msgs[0]
     return {
        ...order,
        otherParty: isShopper ? order.buyer : order.shopper,
        lastMessage,
     }
  })
  
  // Sort chats by latest message, then by order creation
  activeChats.sort((a, b) => {
     const tA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(a.created_at).getTime()
     const tB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(b.created_at).getTime()
     return tB - tA
  })

  return (
    <div className="max-w-4xl space-y-6 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Messages</h1>
        <p className="text-slate-500 mt-1">Communicate regarding your active orders.</p>
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
               <Link key={chat.id} href={`/dashboard/chat/${chat.id}`} className="block hover:bg-slate-50/50 transition-colors p-4 sm:p-5 group">
                  <div className="flex items-center gap-4">
                     <Avatar 
                        src={chat.otherParty?.avatar_url} 
                        name={chat.otherParty?.full_name} 
                        size="lg" 
                     />
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                           <h3 className="font-semibold text-navy-900 truncate group-hover:text-amber-600 transition-colors">
                              {chat.otherParty?.full_name}
                           </h3>
                           <span className="text-xs text-slate-400 shrink-0">
                              {chat.lastMessage ? formatRelativeTime(chat.lastMessage.created_at) : formatRelativeTime(chat.created_at)}
                           </span>
                        </div>
                        <div className="text-xs font-medium text-amber-600 mb-1.5 flex items-center gap-1.5">
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                           </svg>
                           {chat.products ? chat.products.name : 'Custom Request Order'}
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                           {chat.lastMessage ? chat.lastMessage.content : <em>No messages yet</em>}
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
