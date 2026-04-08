import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getOrderStatusColor, formatPrice, formatDate } from '@/lib/utils/formatters'
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

  return (
    <div className="space-y-6 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
           {isShopper ? 'Manage Orders' : 'My Orders'}
        </h1>
        <p className="text-slate-500 mt-1">
           {isShopper ? 'Track and update the status of your active orders.' : 'Track the status of items you have purchased.'}
        </p>
      </div>

      {!items || items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
           <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
               </svg>
           </div>
           <h3 className="text-lg font-semibold text-navy-900 mb-2">No orders yet</h3>
           <p className="text-slate-500 max-w-md">
             When {isShopper ? 'a buyer purchases your item' : 'you purchase an item'}, it will appear here.
           </p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden border-slate-200">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                       <th className="p-4 pl-6">Item</th>
                       <th className="p-4">Date</th>
                       <th className="p-4">{isShopper ? 'Buyer' : 'Shopper'}</th>
                       <th className="p-4">Amount</th>
                       <th className="p-4">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-sm">
                    {items.map((order) => (
                       <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6 font-medium text-navy-900">
                             {order.products?.name || 'Custom Request Order'}
                          </td>
                          <td className="p-4 text-slate-500">
                             {formatDate(order.created_at)}
                          </td>
                          <td className="p-4">
                             {isShopper ? order.buyer?.full_name : order.shopper?.full_name}
                          </td>
                          <td className="p-4 font-medium">
                             {formatPrice(order.amount)}
                          </td>
                          <td className="p-4">
                             <Badge variant={getOrderStatusColor(order.status) as any} className="capitalize">
                                {order.status}
                             </Badge>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>
      )}
    </div>
  )
}
