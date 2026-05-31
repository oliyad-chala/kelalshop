import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CampaignDetailClient } from './CampaignDetailClient'
import { isAdminRole } from '@/lib/utils/admin-roles'

interface Props { params: Promise<{ id: string }> }

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) redirect('/admin/dashboard')

  const admin = createAdminClient()

  // Fetch campaign + all product submissions with seller info
  const [{ data: campaign }, { data: submissions }, { data: allProducts }] = await Promise.all([
    admin.from('promotions').select('*').eq('id', id).single(),
    admin
      .from('promotion_products')
      .select(`
        *,
        products(id, name, price, stock, location, product_images(url, is_primary)),
        profiles!promotion_products_shopper_id_fkey(full_name, email)
      `)
      .eq('promotion_id', id)
      .order('created_at', { ascending: false }),
    // All approved products available to force-add
    admin
      .from('products')
      .select('id, name, price, shopper_id, profiles!products_shopper_id_fkey(full_name)')
      .eq('is_available', true)
      .eq('approval_status', 'approved')
      .order('name'),
  ])

  if (!campaign) redirect('/admin/promotions')

  const pendingCount  = (submissions || []).filter(s => s.status === 'pending').length
  const approvedCount = (submissions || []).filter(s => s.status === 'approved').length
  const rejectedCount = (submissions || []).filter(s => s.status === 'rejected').length

  // Products already in this campaign (so admin can exclude from force-add list)
  const existingProductIds = new Set((submissions || []).map(s => s.product_id))
  const availableToAdd = (allProducts || []).filter(p => !existingProductIds.has(p.id))

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
        <Link href="/admin/promotions" style={{ color: '#6b7280', textDecoration: 'none' }}>Marketing Center</Link>
        <span>›</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{campaign.name}</span>
      </div>

      {/* Campaign Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{campaign.name}</span>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase',
                background: campaign.status === 'active' ? '#d1fae5' : campaign.status === 'upcoming' ? '#dbeafe' : '#f3f4f6',
                color: campaign.status === 'active' ? '#065f46' : campaign.status === 'upcoming' ? '#1e40af' : '#6b7280',
              }}>
                {campaign.status}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span>📅 {new Date(campaign.start_date).toLocaleString()} → {new Date(campaign.end_date).toLocaleString()}</span>
              {campaign.target_country && <span>📍 {campaign.target_country}{campaign.target_region ? ` › ${campaign.target_region}` : ''}</span>}
              {campaign.discount_percentage && <span>🏷 Min {campaign.discount_percentage}% off required</span>}
            </div>
          </div>
          {campaign.banner_image_url && (
            <img src={campaign.banner_image_url} alt={campaign.name} style={{ height: '70px', borderRadius: '8px', objectFit: 'cover', maxWidth: '200px' }} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Pending Review', value: pendingCount,  color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Approved',       value: approvedCount, color: '#10b981', bg: '#d1fae5' },
          { label: 'Rejected',       value: rejectedCount, color: '#ef4444', bg: '#fee2e2' },
          { label: 'Total Products', value: (submissions || []).length, color: '#6366f1', bg: '#e0e7ff' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Interactive Client Component — submissions table + force-add form */}
      <CampaignDetailClient
        campaignId={id}
        submissions={(submissions || []) as any}
        availableToAdd={(availableToAdd || []) as any}
      />
    </div>
  )
}
