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

  // Fetch pending payment requests
  const { data: payments, error: paymentsError } = await admin
    .from('payment_requests')
    .select('id, amount, payment_type, reference_number, status, created_at, shopper_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Fetch all approved payments for revenue total
  const { data: allPayments } = await admin
    .from('payment_requests')
    .select('amount')
    .eq('status', 'approved')

  // Fetch shopper names separately to avoid FK hint issues
  const shopperIds = [...new Set((payments ?? []).map((p: any) => p.shopper_id))]
  let shopperMap: Record<string, string> = {}
  if (shopperIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', shopperIds)
    shopperMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name ?? '—']))
  }

  const rows = (payments ?? []).map((p: any) => ({
    id: p.id,
    shopper: shopperMap[p.shopper_id] ?? '—',
    payment_type: p.payment_type,
    amount: p.amount,
    reference_number: p.reference_number,
    created_at: p.created_at,
  }))

  const totalRevenue = (allPayments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Pending Payments</h1>
          <p className="section-subtitle">Verify manual bank transfers for subscriptions and boosts.</p>
        </div>
        <span className="admin-badge badge-pending">{rows.length} pending</span>
      </div>

      {paymentsError && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>
          Failed to load payments: {paymentsError.message}
        </div>
      )}

      <div style={{ marginBottom: '1.25rem' }}>
        <RevenueCard total={totalRevenue} />
      </div>

      <PaymentsTable rows={rows} />
    </div>
  )
}
