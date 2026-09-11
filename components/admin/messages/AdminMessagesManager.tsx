'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  MessageSquare,
  Package,
  User,
  ArrowUpRight,
  Filter,
  Calendar,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ImageIcon,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatPrice, formatRelativeTime, formatDate } from '@/lib/utils/formatters'

export interface AdminMessageItem {
  id: string
  content: string
  image_url?: string | null
  created_at: string
  sender_id: string
  recipient_id: string
  is_read: boolean
  sender?: {
    id: string
    full_name: string | null
    avatar_url?: string | null
    email?: string | null
    phone?: string | null
  } | null
}

export interface AdminConversationThread {
  threadId: string
  isOrderChat: boolean
  orderId?: string | null
  order?: {
    id: string
    status: string
    amount: number
    created_at: string
    productName?: string | null
  } | null
  buyer: {
    id: string
    full_name: string | null
    avatar_url?: string | null
    email?: string | null
    phone?: string | null
  }
  seller: {
    id: string
    full_name: string | null
    avatar_url?: string | null
    email?: string | null
    phone?: string | null
  }
  messages: AdminMessageItem[]
  lastMessage: AdminMessageItem
  updatedAt: string
}

interface AdminMessagesManagerProps {
  initialThreads: AdminConversationThread[]
}

export function AdminMessagesManager({ initialThreads }: AdminMessagesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'orders' | 'direct' | 'disputed'>('all')
  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    initialThreads[0]?.threadId || ''
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Filter threads based on query and filter tab
  const filteredThreads = useMemo(() => {
    return initialThreads.filter((thread) => {
      // Filter tab
      if (filterType === 'orders' && !thread.isOrderChat) return false
      if (filterType === 'direct' && thread.isOrderChat) return false
      if (filterType === 'disputed' && thread.order?.status !== 'disputed') return false

      // Search query
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const buyerName = thread.buyer.full_name?.toLowerCase() || ''
      const sellerName = thread.seller.full_name?.toLowerCase() || ''
      const productName = thread.order?.productName?.toLowerCase() || ''
      const orderId = thread.orderId?.toLowerCase() || ''
      const hasMatchingMsg = thread.messages.some((m) =>
        m.content?.toLowerCase().includes(q)
      )

      return (
        buyerName.includes(q) ||
        sellerName.includes(q) ||
        productName.includes(q) ||
        orderId.includes(q) ||
        hasMatchingMsg
      )
    })
  }, [initialThreads, searchQuery, filterType])

  // Currently active thread
  const activeThread = useMemo(() => {
    return (
      filteredThreads.find((t) => t.threadId === selectedThreadId) ||
      filteredThreads[0] ||
      null
    )
  }, [filteredThreads, selectedThreadId])

  // Scroll to bottom when active thread or messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeThread?.threadId])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[760px]">
      
      {/* ── Top Bar: Search & Filter Tabs ── */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by buyer, seller, order ID, or message text…"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Threads ({initialThreads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'orders'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Order Chats ({initialThreads.filter((t) => t.isOrderChat).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('direct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'direct'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Direct Messages ({initialThreads.filter((t) => !t.isOrderChat).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('disputed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'disputed'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Disputed ({initialThreads.filter((t) => t.order?.status === 'disputed').length})
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Pane: Conversation Threads List ── */}
        <div className="w-full sm:w-80 md:w-96 border-r border-slate-200 overflow-y-auto divide-y divide-slate-100 shrink-0">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs font-medium">No matching conversation threads found.</p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = thread.threadId === activeThread?.threadId
              return (
                <button
                  key={thread.threadId}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.threadId)}
                  className={`w-full text-left p-4 transition-colors flex items-start gap-3 hover:bg-slate-50 ${
                    isSelected ? 'bg-amber-50/70 border-l-4 border-amber-500' : ''
                  }`}
                >
                  {/* Two overlapping avatar bubbles */}
                  <div className="relative shrink-0 w-10 h-10">
                    <div className="absolute top-0 left-0">
                      <Avatar
                        src={thread.buyer.avatar_url}
                        name={thread.buyer.full_name}
                        size="sm"
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 border-2 border-white rounded-full">
                      <Avatar
                        src={thread.seller.avatar_url}
                        name={thread.seller.full_name}
                        size="xs"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold text-navy-900 truncate">
                        {thread.buyer.full_name || 'Buyer'} & {thread.seller.full_name || 'Seller'}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(thread.updatedAt)}
                      </span>
                    </div>

                    {/* Order or Direct Tag */}
                    <div className="flex items-center gap-1.5 mb-1">
                      {thread.isOrderChat ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          <Package size={10} />
                          {thread.order?.productName || 'Order'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          <MessageSquare size={10} />
                          Direct
                        </span>
                      )}

                      {thread.order?.status && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-medium ${
                          thread.order.status === 'disputed'
                            ? 'bg-red-50 text-red-600'
                            : thread.order.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {thread.order.status}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {thread.lastMessage?.content || <span className="italic text-slate-400">Photo sent</span>}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* ── Right Pane: Transcript Viewer ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/40">
          {activeThread ? (
            <>
              {/* Thread Header Info */}
              <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-navy-900">
                        {activeThread.buyer.full_name} (Buyer) ↔ {activeThread.seller.full_name} (Seller)
                      </h3>
                      {activeThread.order?.status === 'disputed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-[11px] font-bold">
                          <ShieldAlert size={12} />
                          Disputed Order
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Buyer: {activeThread.buyer.phone || activeThread.buyer.email || 'No contact info'}</span>
                      <span>•</span>
                      <span>Seller: {activeThread.seller.phone || activeThread.seller.email || 'No contact info'}</span>
                    </p>
                  </div>
                </div>

                {/* Quick Link to Order or Seller */}
                <div className="flex items-center gap-2">
                  {activeThread.orderId && (
                    <Link
                      href={`/admin/orders/${activeThread.orderId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-navy-900 transition-colors shadow-sm"
                    >
                      <Package size={13} />
                      View Order
                      <ExternalLink size={11} />
                    </Link>
                  )}
                  <Link
                    href={`/admin/sellers/${activeThread.seller.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-navy-900 transition-colors shadow-sm"
                  >
                    <User size={13} />
                    View Seller
                    <ExternalLink size={11} />
                  </Link>
                </div>
              </div>

              {/* Order Context Banner if Order Chat */}
              {activeThread.order && (
                <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-medium">
                    <Package size={14} className="text-amber-600" />
                    <span>Product: <strong>{activeThread.order.productName || 'Order item'}</strong></span>
                    <span>•</span>
                    <span>Amount: <strong>{formatPrice(activeThread.order.amount)}</strong></span>
                  </div>
                  <div className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider">
                    Status: {activeThread.order.status}
                  </div>
                </div>
              )}

              {/* Message Transcript */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-200/60 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                    Conversation Started {formatDate(activeThread.messages[0]?.created_at || activeThread.updatedAt)}
                  </span>
                </div>

                {activeThread.messages.map((msg) => {
                  const isBuyer = msg.sender_id === activeThread.buyer.id
                  const senderName = isBuyer
                    ? `${activeThread.buyer.full_name || 'Buyer'} (Buyer)`
                    : `${activeThread.seller.full_name || 'Seller'} (Seller)`

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isBuyer ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-700">{senderName}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>

                      <div
                        className={`max-w-[75%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                          isBuyer
                            ? 'bg-white text-navy-900 border border-slate-200 rounded-tl-sm'
                            : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-tr-sm shadow-amber-500/10'
                        }`}
                      >
                        {msg.image_url && (
                          <div className="mb-2 overflow-hidden rounded-xl">
                            <img
                              src={msg.image_url}
                              alt="Chat attachment"
                              className="max-h-60 w-auto rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Admin Read-only Notice */}
              <div className="p-3 bg-white border-t border-slate-200 text-center text-[11px] text-slate-400 font-medium">
                🛡️ Admin Oversight Mode: Real-time transcript monitoring for buyer & seller coordination.
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <h4 className="text-sm font-semibold text-slate-600">Select a conversation thread</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose any thread from the left column to view the full dialogue, attachments, and order details.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
