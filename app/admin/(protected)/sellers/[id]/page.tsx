import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, DollarSign, Star, Calendar, CheckCircle, XCircle, Store } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: 'Seller Details' }
}

export default async function SellerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()
  const resolvedParams = await params
  const sellerId = resolvedParams.id

  const { data: seller } = await admin
    .from('shopper_profiles')
    .select(`
      *,
      profiles!inner(full_name, trust_score, phone, location, role)
    `)
    .eq('id', sellerId)
    .single()

  if (!seller) {
    return (
      <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Seller not found</h2>
        <Link href="/admin/sellers" className="admin-btn admin-btn-outline" style={{ marginTop: '1rem', display: 'inline-flex' }}>
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Sellers
        </Link>
      </div>
    )
  }

  // Get products count
  const { count: productCount } = await admin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('shopper_id', sellerId)

  // Get orders and revenue
  const { data: orders } = await admin
    .from('orders')
    .select('amount, status')
    .eq('shopper_id', sellerId)

  const totalRevenue = orders?.filter(o => o.status !== 'cancelled' && o.status !== 'disputed').reduce((sum, o) => sum + Number(o.amount), 0) ?? 0
  const orderCount = orders?.length ?? 0
  const completedOrders = orders?.filter(o => o.status === 'delivered').length ?? 0

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <Link href="/admin/sellers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <ArrowLeft size={14} /> Back to Sellers
          </Link>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {seller.business_name || 'Unnamed Business'}
            {seller.verification_status === 'verified' && <CheckCircle size={20} color="var(--color-primary)" />}
          </h1>
          <p className="section-subtitle">Owned by {seller.profiles.full_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {seller.subscription_plan === 'pro' && <span className="admin-badge badge-verified">Pro Plan</span>}
          <span className={`admin-badge ${seller.verification_status === 'verified' ? 'badge-verified' : seller.verification_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
            {seller.verification_status.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: '50%' }}>
            <DollarSign size={24} color="var(--color-primary)" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Total Revenue</p>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem' }}>ETB {totalRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: '50%' }}>
            <Package size={24} color="var(--color-primary)" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Total Products</p>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem' }}>{productCount ?? 0}</h3>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: '50%' }}>
            <Store size={24} color="var(--color-primary)" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Total Orders</p>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem' }}>{orderCount} ({completedOrders} completed)</h3>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: '50%' }}>
            <Star size={24} color="var(--color-primary)" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Trust Score</p>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem' }}>{seller.profiles.trust_score}%</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="admin-card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Business Information</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Business Name</span>
              <span style={{ fontWeight: 500 }}>{seller.business_name || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Owner Name</span>
              <span style={{ fontWeight: 500 }}>{seller.profiles.full_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Phone Number</span>
              <span style={{ fontWeight: 500 }}>{seller.profiles.phone || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Location</span>
              <span style={{ fontWeight: 500 }}>{seller.profiles.location || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Joined</span>
              <span style={{ fontWeight: 500 }}>{new Date(seller.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Documents</h3>
          
          {seller.id_document_url ? (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>ID Document (Front)</p>
              <a href={seller.id_document_url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: '6px', textAlign: 'center', textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 500 }}>
                View Front Document
              </a>
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No front ID uploaded.</p>
          )}

          {seller.id_document_back_url ? (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>ID Document (Back)</p>
              <a href={seller.id_document_back_url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: '6px', textAlign: 'center', textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 500 }}>
                View Back Document
              </a>
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No back ID uploaded.</p>
          )}
        </div>
      </div>
    </div>
  )
}
