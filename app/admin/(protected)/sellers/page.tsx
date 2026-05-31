import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SellerDataTable } from '@/components/admin/sellers/SellerDataTable'
import { isAdminRole } from '@/lib/utils/admin-roles'

export const metadata = { title: 'Sellers & Subscriptions' }

export default async function SellersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const canManage = isAdminRole(profile?.role)

  const admin = createAdminClient()

  const { data: sellers } = await admin
    .from('shopper_profiles')
    .select(`
      id, business_name, subscription_plan, subscription_expires_at, created_at, verification_status,
      profiles!inner(full_name)
    `)
    .order('created_at', { ascending: false })

  const rows = (sellers ?? []).map((s: any) => ({
    id: s.id,
    full_name: s.profiles?.full_name ?? '—',
    business_name: s.business_name ?? '—',
    subscription_plan: s.subscription_plan,
    subscription_expires_at: s.subscription_expires_at,
    created_at: s.created_at,
    verification_status: s.verification_status,
  }))

  const activeCount = rows.filter((r: any) => r.verification_status === 'verified').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Seller Management</h1>
          <p className="section-subtitle">Manage all sellers, subscriptions, and account statuses</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="admin-badge badge-verified">{activeCount} Active</span>
          <span className="admin-badge badge-default">{rows.length} Total</span>
        </div>
      </div>

      <SellerDataTable rows={rows} canManage={canManage} />
    </div>
  )
}
