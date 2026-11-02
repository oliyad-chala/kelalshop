'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  PhoneCall,
  Search,
  PlusCircle,
  Phone,
  Send,
  MessageSquare,
  Check,
  Copy,
  Clock,
  CheckCircle2,
  Package,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils/formatters'
import { acceptOrder, markOrderShipped, confirmDelivery, cancelOrder } from '@/lib/actions/orders'
import { RecordSaleModal } from './RecordSaleModal'
import { RateSellerButton } from './RateSellerButton'
import { ContactedItemsList } from './ContactedItemsList'

interface OrdersManagerProps {
  isShopper: boolean
  initialOrders: any[]
  sellerProducts: {
    id: string
    name: string
    price: number
    is_available: boolean
    image?: string | null
  }[]
  currentUserId: string
  shopperName?: string
}

export function OrdersManager({
  isShopper,
  initialOrders = [],
  sellerProducts = [],
  currentUserId,
  shopperName,
}: OrdersManagerProps) {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [buyerSubTab, setBuyerSubTab] = useState<'orders' | 'contacted'>('orders')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false)
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const statusLabel: Record<string, string> = {
    pending: 'Processing',
    accepted: 'Accepted',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
  }

  // Count metrics for shopper tabs
  const totalCount = orders.length
  const directSalesCount = orders.filter((o) => o.notes?.includes('[Direct Sale]')).length
  const needsActionCount = orders.filter((o) => o.status === 'pending').length
  const completedCount = orders.filter((o) => o.status === 'delivered').length

  // Filter orders based on active tab and search
  const filteredOrders = orders.filter((order) => {
    const isDirect = Boolean(order.notes?.includes('[Direct Sale]'))

    // Tab filter
    if (activeTab === 'direct' && !isDirect) return false
    if (activeTab === 'pending' && order.status !== 'pending') return false
    if (activeTab === 'completed' && order.status !== 'delivered') return false

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const prodName = (order.products?.name || '').toLowerCase()
      const buyerName = (order.buyer?.full_name || '').toLowerCase()
      const shopperName = (order.shopper?.full_name || '').toLowerCase()
      const notes = (order.notes || '').toLowerCase()
      return prodName.includes(q) || buyerName.includes(q) || shopperName.includes(q) || notes.includes(q)
    }

    return true
  })

  const handleAction = async (orderId: string, actionFn: (id: string) => Promise<any>, newStatus: string) => {
    setProcessingId(orderId)
    try {
      await actionFn(orderId)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    } catch (err) {
      console.error('Order action failed:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const copyReviewLink = async (order: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kelalshop.com'
    const link = order.product_id
      ? `${origin}/products/${order.product_id}?rate=open`
      : `${origin}/shoppers/${currentUserId}?rate=open`

    const message = `Thank you for your purchase from ${shopperName || 'our shop'}! Please take 5 seconds to rate your experience on KelalShop: ${link}`
    try {
      await navigator.clipboard.writeText(message)
      setCopiedOrderId(order.id)
      setTimeout(() => setCopiedOrderId(null), 2500)
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-navy-950 tracking-tight">
              {isShopper ? 'Manage Orders & Sales' : 'My Orders & Inquiries'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {totalCount} total
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            {isShopper
              ? 'Track offline phone/Telegram sales and in-app requests all in one place.'
              : 'Track request fulfillments and products you contacted sellers about.'}
          </p>
        </div>

        {/* Top Action Button */}
        {isShopper && (
          <button
            type="button"
            onClick={() => setIsRecordSaleOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>+ Record Direct Sale</span>
          </button>
        )}
      </div>

      {/* Buyer Tabs (Orders vs Contacted Items) */}
      {!isShopper && (
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setBuyerSubTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              buyerSubTab === 'orders'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-navy-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Orders</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBuyerSubTab('contacted')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              buyerSubTab === 'contacted'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-navy-900'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contacted Sellers & Items</span>
          </button>
        </div>
      )}

      {/* Shopper Filter Tabs */}
      {isShopper && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Orders', count: totalCount },
              { id: 'direct', label: 'Offline Direct Sales 📞', count: directSalesCount },
              { id: 'pending', label: 'Needs Action ⚡', count: needsActionCount },
              { id: 'completed', label: 'Completed ✓', count: completedCount },
            ].map((tab) => {
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-navy-950 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search buyer or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-amber-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      {!isShopper && buyerSubTab === 'contacted' ? (
        <ContactedItemsList />
      ) : filteredOrders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed rounded-3xl">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-navy-950 mb-1">No orders found</h3>
          <p className="text-slate-500 max-w-sm text-xs leading-relaxed">
            {searchQuery
              ? `No matching orders for "${searchQuery}". Try a different keyword.`
              : isShopper
              ? 'When buyers purchase via phone call, Telegram, or checkout, orders will appear here.'
              : 'You have not placed any orders yet.'}
          </p>
          {isShopper && (
            <button
              onClick={() => setIsRecordSaleOpen(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              + Record a Direct Sale
            </button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isDirectSale = Boolean(order.notes?.includes('[Direct Sale]'))
            const cleanNotes = order.notes ? order.notes.replace('[Direct Sale] ', '') : ''

            // Extract customer phone & name from direct sale note if buyer profile was self
            const phoneMatch = cleanNotes.match(/Phone:\s*([^\s|]+)/i)
            const customerPhone = order.buyer?.phone || (phoneMatch ? phoneMatch[1] : null)

            const nameMatch = cleanNotes.match(/Customer:\s*([^|]+)/i)
            const customerName =
              order.buyer && order.buyer.id !== currentUserId
                ? order.buyer.full_name
                : nameMatch
                ? nameMatch[1].trim()
                : 'Direct Customer'

            const telegramUsername =
              (order.buyer as any)?.telegram_users?.[0]?.username ||
              (order.buyer as any)?.telegram_users?.username

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden hover:border-slate-300 transition-colors"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        isDirectSale
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isDirectSale ? '📞' : '📦'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-navy-950 text-sm">
                          {order.products?.name || 'Custom Request Order'}
                        </h4>
                        {isDirectSale ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            Offline Direct Sale
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                            App Order
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isShopper ? `Buyer: ${customerName}` : `Shopper: ${order.shopper?.full_name || 'Seller'}`}
                        {' · '}
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-amber-600">
                      {formatPrice(order.amount)}
                    </span>
                    <Badge variant={getOrderStatusColor(order.status) as any} size="md" className="capitalize text-xs">
                      {statusLabel[order.status] ?? order.status}
                    </Badge>
                  </div>
                </div>

                {/* Details Section */}
                <div className="px-6 py-4 border-b border-slate-100 bg-white">
                  {isDirectSale ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                          Log Info:
                        </span>
                        <span className="font-medium text-slate-800">{cleanNotes}</span>
                      </div>

                      {/* 1-Click Quick Contact Shortcuts */}
                      <div className="flex items-center gap-2">
                        {customerPhone && (
                          <a
                            href={`tel:${customerPhone}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200/70 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call ({customerPhone})</span>
                          </a>
                        )}

                        {telegramUsername && (
                          <a
                            href={`https://t.me/${telegramUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200/70 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Telegram</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* App Order Details */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Contact Person</span>
                        <span className="font-bold text-navy-950 mt-0.5 block">{customerName}</span>
                      </div>
                      {customerPhone && (
                        <div>
                          <span className="text-slate-400 font-semibold block text-[10px] uppercase">Phone Number</span>
                          <a href={`tel:${customerPhone}`} className="font-bold text-amber-600 hover:underline mt-0.5 inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customerPhone}
                          </a>
                        </div>
                      )}
                      {telegramUsername && (
                        <div>
                          <span className="text-slate-400 font-semibold block text-[10px] uppercase">Telegram</span>
                          <a
                            href={`https://t.me/${telegramUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-sky-600 hover:underline mt-0.5 inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            @{telegramUsername}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions Row */}
                <div className="px-6 py-3.5 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Message on Kelalshop */}
                    <Link
                      href={`/dashboard/chat/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isShopper ? 'Message Buyer' : 'Message Shopper'}</span>
                    </Link>

                    {/* Shopper 'Copy Review Invite' for direct sales */}
                    {isShopper && (
                      <button
                        type="button"
                        onClick={() => copyReviewLink(order)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          copiedOrderId === order.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80'
                        }`}
                      >
                        {copiedOrderId === order.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Invite Copied!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Copy Rating Invite Link</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-2">
                    {isShopper && order.status === 'pending' && (
                      <button
                        type="button"
                        disabled={processingId === order.id}
                        onClick={() => handleAction(order.id, acceptOrder, 'accepted')}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Accept Order
                      </button>
                    )}

                    {isShopper && (order.status === 'accepted' || order.status === 'pending') && (
                      <button
                        type="button"
                        disabled={processingId === order.id}
                        onClick={() => handleAction(order.id, markOrderShipped, 'shipped')}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Mark as Shipped
                      </button>
                    )}

                    {!isShopper && order.status === 'pending' && (
                      <button
                        type="button"
                        disabled={processingId === order.id}
                        onClick={() => handleAction(order.id, cancelOrder, 'cancelled')}
                        className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Cancel Order
                      </button>
                    )}

                    {!isShopper && order.status === 'shipped' && (
                      <button
                        type="button"
                        disabled={processingId === order.id}
                        onClick={() => handleAction(order.id, confirmDelivery, 'delivered')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        ✓ I Received the Item
                      </button>
                    )}

                    {!isShopper && order.status === 'delivered' && (
                      <RateSellerButton
                        shopperName={order.shopper?.full_name || 'Seller'}
                        orderId={order.id}
                        shopperId={order.shopper_id as string}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Record Sale Modal */}
      {isShopper && (
        <RecordSaleModal
          isOpen={isRecordSaleOpen}
          onClose={() => setIsRecordSaleOpen(false)}
          products={sellerProducts}
          shopperId={currentUserId}
          shopperName={shopperName}
          onSuccess={() => {
            if (typeof window !== 'undefined') window.location.reload()
          }}
        />
      )}
    </div>
  )
}

