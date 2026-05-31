import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { syncCampaignStatuses } from '@/lib/utils/campaign-status'
import { PromotionsTable, type PromotionRow } from '@/components/admin/promotions/PromotionsTable'

export const metadata = { title: 'Marketing Center | KelalShop Admin' }

export default async function AdminPromotionsPage() {
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

  await syncCampaignStatuses(admin)

  const [{ data: promotions }, { data: productCounts }] = await Promise.all([
    admin.from('promotions').select('*').order('created_at', { ascending: false }),
    admin.from('promotion_products').select('promotion_id, status'),
  ])

  const countMap: Record<string, { approved: number; pending: number }> = {}
  for (const pp of productCounts ?? []) {
    if (!countMap[pp.promotion_id]) countMap[pp.promotion_id] = { approved: 0, pending: 0 }
    if (pp.status === 'approved') countMap[pp.promotion_id].approved++
    if (pp.status === 'pending') countMap[pp.promotion_id].pending++
  }

  const rows: PromotionRow[] = (promotions ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    status: p.status,
    start_date: p.start_date,
    end_date: p.end_date,
    target_country: p.target_country,
    target_region: p.target_region,
    approvedCount: countMap[p.id]?.approved ?? 0,
    pendingCount: countMap[p.id]?.pending ?? 0,
  }))

  const activeCount = rows.filter((r) => r.status === 'active').length
  const upcomingCount = rows.filter((r) => r.status === 'upcoming').length
  const pendingReviews = rows.reduce((s, r) => s + r.pendingCount, 0)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Marketing Center</h1>
          <p className="section-subtitle">
            Create flash sales, geo-targeted banners, and shipping deals. Sellers see and join your campaigns.
          </p>
        </div>
        {canManage && (
          <Link href="/admin/promotions/new" className="admin-btn admin-btn-primary">
            + New Campaign
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Active Campaigns', value: activeCount },
          { label: 'Upcoming', value: upcomingCount },
          { label: 'Pending Reviews', value: pendingReviews },
          { label: 'Total Campaigns', value: rows.length },
        ].map((stat) => (
          <div key={stat.label} className="admin-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent-500)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>All Campaigns</h2>
        {rows.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>No campaigns yet</h3>
            <p style={{ fontSize: '0.9rem' }}>
              {canManage ? 'Create your first flash sale and announce it to sellers.' : 'No campaigns have been created yet.'}
            </p>
            {canManage && (
              <Link href="/admin/promotions/new" className="admin-btn admin-btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                Create Campaign
              </Link>
            )}
          </div>
        ) : (
          <PromotionsTable rows={rows} canManage={canManage} />
        )}
      </div>
    </div>
  )
}
