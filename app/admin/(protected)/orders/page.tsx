import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrderDataTable } from '@/components/admin/orders/OrderDataTable'

export const metadata = { title: 'Order Management' }

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data } = await admin
    .from('orders')
    .select(`
      id, amount, status, created_at,
      products(name),
      buyer:profiles!orders_buyer_id_fkey(full_name),
      shopper:profiles!orders_shopper_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  const rows = (data ?? []).map((o: any) => ({
    id: o.id,
    productName: o.products?.name ?? null,
    buyerName: o.buyer?.full_name ?? '—',
    shopperName: o.shopper?.full_name ?? '—',
    amount: o.amount,
    status: o.status,
    created_at: o.created_at,
  }))

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="section-title">Orders</h1>
        </div>
      </div>

      <OrderDataTable rows={rows} />
    </div>
  )
}
