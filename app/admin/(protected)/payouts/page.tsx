import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PayoutsTable, TotalWalletCard } from '@/components/admin/PayoutsTable'

export const metadata = { title: 'Financial Monitor' }

export default async function PayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const [{ data: orders }, { data: shoppers }] = await Promise.all([
    admin
      .from('orders')
      .select(`
        id, amount, commission_rate, status, payout_released, created_at,
        buyer:profiles!orders_buyer_id_fkey(full_name),
        shopper:profiles!orders_shopper_id_fkey(full_name)
      `)
      .eq('status', 'delivered')
      .eq('payout_released', false)
      .order('created_at', { ascending: false }),
    admin.from('shopper_profiles').select('wallet_balance'),
  ])

  const rows = (orders ?? []).map((o: any) => ({
    id: o.id,
    buyer:   o.buyer?.full_name  ?? '—',
    shopper: o.shopper?.full_name ?? '—',
    amount:  o.amount,
    commission_rate: o.commission_rate,
    created_at: o.created_at,
  }))

  const totalWallet = (shoppers ?? []).reduce((s, sp) => s + Number(sp.wallet_balance), 0)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Financial Monitor</h1>
          <p className="section-subtitle">Delivered orders awaiting payout confirmation</p>
        </div>
        <span className="admin-badge badge-pending">{rows.length} pending</span>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <TotalWalletCard total={totalWallet} />
      </div>

      <PayoutsTable rows={rows} />
    </div>
  )
}
