import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updateCampaignStatus, deleteCampaign } from '@/lib/actions/campaigns'

export const metadata = { title: 'Marketing Center | KelalShop Admin' }

const STATUS_STYLES: Record<string, string> = {
  active:   'background:#d1fae5;color:#065f46;',
  upcoming: 'background:#dbeafe;color:#1e40af;',
  ended:    'background:#f3f4f6;color:#6b7280;',
}

const TYPE_LABELS: Record<string, string> = {
  flash_sale_campaign: '⚡ Flash Sale',
  banner:              '🖼 Banner',
  shipping:            '🚚 Shipping Deal',
}

export default async function AdminPromotionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const [
    { data: promotions },
    { count: pendingCount },
  ] = await Promise.all([
    admin.from('promotions').select('*').order('created_at', { ascending: false }),
    admin.from('promotion_products').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const activeCount   = (promotions || []).filter(p => p.is_active && p.status === 'active').length
  const upcomingCount = (promotions || []).filter(p => p.status === 'upcoming').length

  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy-900, #0f172a)', margin: 0 }}>
            ⚡ Marketing Center
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Create flash sales, geo-targeted banners, and shipping deals. Sellers see and join your campaigns.
          </p>
        </div>
        <Link
          href="/admin/promotions/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            padding: '0.65rem 1.4rem', borderRadius: '10px',
            textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          + New Campaign
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Active Campaigns', value: activeCount, color: '#10b981', bg: '#d1fae5' },
          { label: 'Upcoming',         value: upcomingCount, color: '#3b82f6', bg: '#dbeafe' },
          { label: 'Pending Reviews',  value: pendingCount ?? 0, color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Total Campaigns',  value: (promotions || []).length, color: '#6366f1', bg: '#e0e7ff' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px',
            padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Campaigns Table */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>All Campaigns</span>
          {(pendingCount ?? 0) > 0 && (
            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
              {pendingCount} pending review{(pendingCount ?? 0) > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {(!promotions || promotions.length === 0) ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📢</div>
            <h3 style={{ fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>No campaigns yet</h3>
            <p style={{ fontSize: '0.9rem' }}>Create your first flash sale and announce it to sellers.</p>
            <Link href="/admin/promotions/new" style={{ display: 'inline-block', marginTop: '1rem', background: '#f59e0b', color: '#fff', padding: '0.6rem 1.4rem', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>
              Create Campaign
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', color: '#6b7280', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {['Campaign', 'Type', 'Target', 'Schedule', 'Status', 'Products', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo, i) => (
                <tr key={promo.id} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined, transition: 'background 0.15s' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{promo.name}</div>
                    {promo.discount_percentage && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Min {promo.discount_percentage}% off required</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ background: '#f3f4f6', color: '#374151', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {TYPE_LABELS[promo.type] ?? promo.type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '0.83rem' }}>
                    {promo.target_country ? (
                      <>{promo.target_country}{promo.target_region ? ` › ${promo.target_region}` : ''}{promo.target_city ? ` › ${promo.target_city}` : ''}</>
                    ) : '🌍 Global'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '0.8rem' }}>
                    <div>{new Date(promo.start_date).toLocaleDateString()}</div>
                    <div style={{ color: '#9ca3af' }}>→ {new Date(promo.end_date).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, ...Object.fromEntries((STATUS_STYLES[promo.status] || 'background:#f3f4f6;color:#6b7280;').split(';').filter(Boolean).map(s => s.split(':'))) }}>
                      {promo.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                    <Link href={`/admin/promotions/${promo.id}`} style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                      View →
                    </Link>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link
                        href={`/admin/promotions/${promo.id}`}
                        style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Manage
                      </Link>
                      {promo.status === 'upcoming' && (
                        <form action={async () => {
                          'use server'
                          await updateCampaignStatus(promo.id, 'active')
                        }}>
                          <button type="submit" style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Activate
                          </button>
                        </form>
                      )}
                      {promo.status === 'active' && (
                        <form action={async () => {
                          'use server'
                          await updateCampaignStatus(promo.id, 'ended')
                        }}>
                          <button type="submit" style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            End
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
