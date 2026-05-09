import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentsTable, RevenueCard } from '@/components/admin/PaymentsTable'

export const metadata = { title: 'Pending Payments' }

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const [{ data: payments }, { data: allPayments }] = await Promise.all([
    admin
      .from('payment_requests')
      .select(`
        id, amount, payment_type, reference_number, status, created_at,
        shopper:profiles!payment_requests_shopper_id_fkey(full_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin
      .from('payment_requests')
      .select('amount')
      .eq('status', 'approved')
  ])

  const rows = (payments ?? []).map((p: any) => ({
    id: p.id,
    shopper: p.shopper?.full_name ?? '—',
    payment_type: p.payment_type,
    amount:  p.amount,
    reference_number: p.reference_number,
    created_at: p.created_at,
  }))

  const totalRevenue = (allPayments ?? []).reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Pending Payments</h1>
          <p className="section-subtitle">Verify manual bank transfers for subscriptions and boosts.</p>
        </div>
        <span className="admin-badge badge-pending">{rows.length} pending</span>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <RevenueCard total={totalRevenue} />
      </div>

      <PaymentsTable rows={rows} />
    </div>
  )
}
