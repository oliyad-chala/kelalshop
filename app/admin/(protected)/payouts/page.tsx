import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentDataTable, RevenueCard } from '@/components/admin/payments/PaymentDataTable'
import { Info } from 'lucide-react'

export const metadata = { title: 'Payment Management' }

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  // Fetch all payment requests
  const { data: payments, error: paymentsError } = await admin
    .from('payment_requests')
    .select('id, amount, payment_type, reference_number, status, created_at, shopper_id')
    .order('created_at', { ascending: false })

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
    status: p.status,
    created_at: p.created_at,
  }))

  const totalRevenue = rows.filter((r: any) => r.status === 'approved').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const pendingCount = rows.filter((r: any) => r.status === 'pending').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Payment & Billing Management</h1>
          <p className="section-subtitle">Manage transactions, seller payouts, and platform revenue.</p>
        </div>
      </div>

      {paymentsError && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>
          Failed to load payments: {paymentsError.message}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <div className="admin-alert admin-alert-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
          <Info size={16} />
          <span style={{ fontSize: '0.85rem' }}>Standard automated payment integrations (Stripe, Chapa) are being prepared. Currently supporting manual bank transfers.</span>
        </div>
        <RevenueCard total={totalRevenue} pendingCount={pendingCount} />
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Transaction History</h2>
        <PaymentDataTable rows={rows} />
      </div>
    </div>
  )
}
