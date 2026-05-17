import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getOrderStatusColor, formatPrice, formatDate } from '@/lib/utils/formatters'
import { acceptOrder, markOrderShipped, confirmDelivery, cancelOrder } from '@/lib/actions/orders'
import { RealtimeListener } from '@/components/dashboard/RealtimeListener'
import { RateSellerButton } from '@/components/orders/RateSellerButton'
import type { OrderWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'Orders | KelalShop',
}

export default async function DashboardOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isShopper = profile?.role === 'shopper' || profile?.role === 'admin'

  let query = supabase
    .from('orders')
    .select('*, products(name, price), buyer:buyer_id(full_name), shopper:shopper_id(full_name)')

  if (isShopper) {
    query = query.eq('shopper_id', user.id)
  } else {
    query = query.eq('buyer_id', user.id)
  }

  const { data: orders } = await query.order('created_at', { ascending: false })
  const items = orders as unknown as OrderWithDetails[] | null

  const statusLabel: Record<string, string> = {
    pending: 'Processing',
    accepted: 'Accepted',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
  }

  return (
    <div className="space-y-6 fade-in">
      <RealtimeListener userId={user.id} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
          {isShopper ? 'Manage Orders' : 'My Orders'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isShopper
            ? 'Track and update the status of your active orders.'
            : 'Track the status of items you have purchased.'}
        </p>
      </div>

      {/* Workflow legend */}
      <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500 mb-2">
        <span className="font-medium text-slate-600">Workflow:</span>
        {['Processing', 'Accepted', 'Shipped', 'Delivered'].map((s, i, arr) => (
          <span key={s} className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{s}</span>
            {i < arr.length - 1 && <span>→</span>}
          </span>
        ))}
      </div>

      {!items || items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">No orders yet</h3>
          <p className="text-slate-500 max-w-md text-sm">
            When {isShopper ? 'a buyer purchases your item' : 'you purchase an item'}, it will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Order header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <p className="font-semibold text-navy-900">{order.products?.name || 'Custom Request Order'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isShopper ? `Buyer: ${order.buyer?.full_name}` : `Shopper: ${order.shopper?.full_name}`}
                    {' · '}{formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-navy-900">{formatPrice(order.amount)}</span>
                  <Badge variant={getOrderStatusColor(order.status) as any} size="md" className="capitalize">
                    {statusLabel[order.status] ?? order.status}
                  </Badge>
                </div>
              </div>


              {/* Actions */}
              <div className="px-6 py-4 flex flex-wrap gap-3 items-center justify-end">
                {/* Chat Action */}
                <Link 
                  href={`/dashboard/chat/${order.id}`}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors flex justify-center items-center gap-2 w-full sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {isShopper ? 'Message Buyer' : 'Message Seller'}
                </Link>

                {/* Shopper actions */}
                {isShopper && order.status === 'pending' && (
                  <form action={async () => { 'use server'; await acceptOrder(order.id) }} className="w-full sm:w-auto">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors w-full sm:w-auto"
                    >
                      Accept Order
                    </button>
                  </form>
                )}
                {isShopper && (order.status === 'accepted' || order.status === 'pending') && (
                  <form action={async () => { 'use server'; await markOrderShipped(order.id) }} className="w-full sm:w-auto">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors w-full sm:w-auto"
                    >
                      Mark as Shipped
                    </button>
                  </form>
                )}

                {/* Buyer actions */}
                {!isShopper && order.status === 'pending' && (
                  <form action={async () => { 'use server'; await cancelOrder(order.id) }} className="w-full sm:w-auto">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors w-full sm:w-auto"
                    >
                      Cancel Order
                    </button>
                  </form>
                )}
                {!isShopper && order.status === 'shipped' && (
                  <form action={async () => { 'use server'; await confirmDelivery(order.id) }} className="w-full sm:w-auto">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors w-full sm:w-auto"
                    >
                      ✓ I Received the Item
                    </button>
                  </form>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                    </span>
                    {!isShopper && (
                      <RateSellerButton 
                        shopperName={order.shopper?.full_name || 'Seller'} 
                        orderId={order.id}
                        shopperId={order.shopper_id as string}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
