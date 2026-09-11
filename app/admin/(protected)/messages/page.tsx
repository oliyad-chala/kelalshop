import { requireStaffOrAdmin } from '@/lib/actions/admin-access'
import { AdminMessagesManager, AdminConversationThread, AdminMessageItem } from '@/components/admin/messages/AdminMessagesManager'
import { MessageSquare, Package, Users, ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Buyer-Seller Chats | Admin Portal',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminMessagesPage() {
  const { adminClient } = await requireStaffOrAdmin()

  // 1. Fetch orders that have messages
  const { data: ordersWithMessages } = await adminClient
    .from('orders')
    .select(`
      id,
      status,
      amount,
      created_at,
      products(name),
      buyer:buyer_id(id, full_name, avatar_url, phone),
      shopper:shopper_id(id, full_name, avatar_url, phone),
      messages(id, content, image_url, created_at, sender_id, recipient_id, is_read)
    `)
    .order('created_at', { ascending: false })

  // 2. Fetch direct messages (where order_id is null)
  const { data: directMessages } = await adminClient
    .from('messages')
    .select(`
      id,
      content,
      image_url,
      created_at,
      sender_id,
      recipient_id,
      is_read,
      order_id,
      sender:sender_id(id, full_name, avatar_url, phone),
      recipient:recipient_id(id, full_name, avatar_url, phone)
    `)
    .is('order_id', null)
    .order('created_at', { ascending: false })
    .limit(300)

  // ─── Assemble Order Threads ──────────────────────────────────────────────
  const orderThreads: AdminConversationThread[] = (ordersWithMessages || [])
    .filter((order: any) => order.messages && order.messages.length > 0)
    .map((order: any) => {
      const msgs: AdminMessageItem[] = [...order.messages].sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const lastMsg = msgs[msgs.length - 1]

      const buyer = order.buyer || {
        id: 'unknown-buyer',
        full_name: 'Unknown Buyer',
        avatar_url: null,
      }
      const seller = order.shopper || {
        id: 'unknown-seller',
        full_name: 'Unknown Seller',
        avatar_url: null,
      }

      return {
        threadId: `order_${order.id}`,
        isOrderChat: true,
        orderId: order.id,
        order: {
          id: order.id,
          status: order.status,
          amount: Number(order.amount) || 0,
          created_at: order.created_at,
          productName: order.products?.name || 'Custom Request Order',
        },
        buyer,
        seller,
        messages: msgs,
        lastMessage: lastMsg,
        updatedAt: lastMsg ? lastMsg.created_at : order.created_at,
      }
    })

  // ─── Assemble Direct Message Threads ─────────────────────────────────────
  const dmMap = new Map<string, { buyer: any; seller: any; messages: AdminMessageItem[] }>()

  if (directMessages) {
    for (const msg of directMessages as any[]) {
      if (!msg.sender || !msg.recipient) continue

      // Unique symmetric key for the pair of users
      const pairKey = [msg.sender_id, msg.recipient_id].sort().join('__')

      if (!dmMap.has(pairKey)) {
        dmMap.set(pairKey, {
          buyer: msg.sender,
          seller: msg.recipient,
          messages: [],
        })
      }
      dmMap.get(pairKey)!.messages.push({
        id: msg.id,
        content: msg.content,
        image_url: msg.image_url,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        is_read: msg.is_read,
        sender: msg.sender,
      })
    }
  }

  const directThreads: AdminConversationThread[] = Array.from(dmMap.entries()).map(
    ([pairKey, threadData]) => {
      const sortedMsgs = [...threadData.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const lastMsg = sortedMsgs[sortedMsgs.length - 1]

      return {
        threadId: `dm_${pairKey}`,
        isOrderChat: false,
        orderId: null,
        order: null,
        buyer: threadData.buyer,
        seller: threadData.seller,
        messages: sortedMsgs,
        lastMessage: lastMsg,
        updatedAt: lastMsg ? lastMsg.created_at : new Date().toISOString(),
      }
    }
  )

  // ─── Merge and Sort All Threads ──────────────────────────────────────────
  const allThreads: AdminConversationThread[] = [...orderThreads, ...directThreads].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  // ─── Summary Stats ───────────────────────────────────────────────────────
  const totalThreads = allThreads.length
  const orderChatsCount = orderThreads.length
  const directChatsCount = directThreads.length
  const disputedCount = orderThreads.filter((t) => t.order?.status === 'disputed').length

  return (
    <div className="space-y-6 fade-in">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
          <MessageSquare className="text-amber-500 w-7 h-7" />
          Buyer-Seller Conversations
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitor and supervise all communications between buyers and sellers across the marketplace.
        </p>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Conversations</p>
            <p className="text-xl font-bold text-navy-900 leading-tight mt-0.5">{totalThreads}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Order-Linked Chats</p>
            <p className="text-xl font-bold text-navy-900 leading-tight mt-0.5">{orderChatsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Direct Inquiries</p>
            <p className="text-xl font-bold text-navy-900 leading-tight mt-0.5">{directChatsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Disputed Order Chats</p>
            <p className="text-xl font-bold text-navy-900 leading-tight mt-0.5">{disputedCount}</p>
          </div>
        </div>
      </div>

      {/* ── Main Interactive Manager ── */}
      <AdminMessagesManager initialThreads={allThreads} />

    </div>
  )
}
