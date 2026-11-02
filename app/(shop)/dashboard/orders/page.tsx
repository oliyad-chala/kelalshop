import { createClient } from '@/lib/supabase/server'
import { getSellerProductsForSale } from '@/lib/actions/orders'
import { RealtimeListener } from '@/components/dashboard/RealtimeListener'
import { OrdersManager } from '@/components/orders/OrdersManager'
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
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isShopper = profile?.role === 'shopper' || profile?.role === 'admin'

  let query = supabase
    .from('orders')
    .select('*, products(name, price), buyer:buyer_id(id, full_name, phone, telegram_users(username)), shopper:shopper_id(id, full_name, phone, location, telegram_users(username))')

  if (isShopper) {
    query = query.eq('shopper_id', user.id)
  } else {
    query = query.eq('buyer_id', user.id)
  }

  const [ordersRes, sellerProducts] = await Promise.all([
    query.order('created_at', { ascending: false }),
    isShopper ? getSellerProductsForSale() : Promise.resolve([]),
  ])

  const items = ordersRes.data as unknown as OrderWithDetails[] | null

  return (
    <div className="space-y-6 fade-in pb-12">
      <RealtimeListener userId={user.id} />
      <OrdersManager
        isShopper={isShopper}
        initialOrders={items || []}
        sellerProducts={sellerProducts as any}
        currentUserId={user.id}
        shopperName={profile?.full_name}
      />
    </div>
  )
}
