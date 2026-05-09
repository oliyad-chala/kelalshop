import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SellersTable } from '@/components/admin/SellersTable'

export const metadata = { title: 'Sellers & Subscriptions' }

export default async function SellersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: sellers } = await admin
    .from('shopper_profiles')
    .select(`
      id, business_name, subscription_plan, subscription_expires_at, created_at, verification_status,
      profiles!inner(full_name)
    `)
    .eq('verification_status', 'verified')
    .order('created_at', { ascending: false })

  const rows = (sellers ?? []).map((s: any) => ({
    id: s.id,
    full_name: s.profiles?.full_name ?? '—',
    business_name: s.business_name ?? '—',
    subscription_plan: s.subscription_plan,
    subscription_expires_at: s.subscription_expires_at,
    created_at: s.created_at,
  }))

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Sellers & Subscriptions</h1>
          <p className="section-subtitle">Manage verified sellers and their subscription packages</p>
        </div>
        <span className="admin-badge badge-default">{rows.length} sellers</span>
      </div>

      <SellersTable rows={rows} />
    </div>
  )
}
