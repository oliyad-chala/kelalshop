import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { getOrderStatusColor, formatPrice } from '@/lib/utils/formatters'

export const metadata = {
  title: 'Chat | KelalShop',
}

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // order id
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as any


  const isShopper = profile?.role === 'shopper'

  // Fetch the order and verify the user is a participant
  const { data: order } = await supabase
    .from('orders')
    .select('*, products(name, price), buyer:buyer_id(*), shopper:shopper_id(*)')
    .eq('id', id)
    .single()

  if (!order || (order.buyer_id !== user.id && order.shopper_id !== user.id)) {
    notFound() // order doesn't exist or user doesn't have access
  }

  // Fetch all messages for this order, ascending to render top-to-bottom
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: true })

  const otherParty = isShopper ? order.buyer : order.shopper

  return (
    <div className="max-w-4xl h-[calc(100vh-8rem)] flex flex-col fade-in">
      
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
         <div className="flex items-center gap-3">
            <Link href="/dashboard/chat" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-navy-900 hover:bg-slate-50 transition-colors">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
            </Link>
            <Avatar src={otherParty?.avatar_url} name={otherParty?.full_name} size="md" />
            <div>
               <div className="font-bold text-navy-900">{otherParty?.full_name}</div>
               <div className="text-xs text-slate-500">{isShopper ? 'Buyer' : 'Shopper'}</div>
            </div>
         </div>

         <div className="flex items-center gap-4 sm:border-l border-slate-100 sm:pl-4">
            <div>
               <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Order</div>
               <div className="font-semibold text-navy-900 max-w-[150px] truncate">
                  {order.products?.name || 'Custom Request'}
               </div>
            </div>
            <div className="text-right">
               <div className="font-bold text-amber-600">{formatPrice(order.amount)}</div>
               <Badge variant={getOrderStatusColor(order.status) as any} size="sm" className="capitalize mt-0.5">
                  {order.status}
               </Badge>
            </div>
         </div>
      </div>

      {/* Main Chat Interface */}
      <ChatWindow 
         orderId={id} 
         currentUserId={user.id} 
         initialMessages={messages || []} 
      />
      
    </div>
  )
}
