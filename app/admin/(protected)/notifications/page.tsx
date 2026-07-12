import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { getAdminAlertCounts, getRecentPendingProducts, totalAlertCount } from '@/lib/data/admin-alerts'
import { 
  Bell, AlertTriangle, CheckCircle, Clock, Package, 
  ShoppingCart, Megaphone, ShieldCheck, Wallet, ArrowRight, MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { getSupportInbox } from './actions'
import SupportInboxClient from './SupportInboxClient'

export const metadata = { title: 'Notifications & Support' }

export default async function NotificationsPage() {
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
  const [alerts, pendingProducts, inboxRes] = await Promise.all([
    getAdminAlertCounts(admin, user.id),
    getRecentPendingProducts(admin, 10),
    getSupportInbox()
  ])

  const initialConversations = 'conversations' in inboxRes ? inboxRes.conversations : []
  const allClear = totalAlertCount(alerts) === 0

  const alertCards = [
    {
      show: alerts.pendingProducts > 0,
      href: '/admin/products',
      icon: <Package size={18} color="#8b5cf6" />,
      title: 'Products Awaiting Approval',
      titleColor: '#6d28d9',
      bg: 'rgba(139, 92, 246, 0.1)',
      message: `${alerts.pendingProducts} new listing(s) need moderation before they appear on the shop.`,
    },
    {
      show: alerts.pendingVerifications > 0,
      href: '/admin/verifications',
      icon: <ShieldCheck size={18} color="#f59e0b" />,
      title: 'Seller Verifications',
      titleColor: '#b45309',
      bg: 'rgba(245, 158, 11, 0.1)',
      message: `You have ${alerts.pendingVerifications} pending seller verification(s) to review.`,
    },
    {
      show: alerts.pendingPayments > 0,
      href: '/admin/payouts',
      icon: <Wallet size={18} color="#3b82f6" />,
      title: 'Pending Payments',
      titleColor: '#1d4ed8',
      bg: 'rgba(59, 130, 246, 0.1)',
      message: `There are ${alerts.pendingPayments} manual payment(s) waiting for approval.`,
    },
    {
      show: alerts.pendingCampaignReviews > 0,
      href: '/admin/promotions',
      icon: <Megaphone size={18} color="#6366f1" />,
      title: 'Campaign Submissions',
      titleColor: '#4338ca',
      bg: 'rgba(99, 102, 241, 0.1)',
      message: `${alerts.pendingCampaignReviews} seller product submission(s) need review in Marketing Center.`,
    },
    {
      show: alerts.pendingOrders > 0,
      href: '/admin/orders?status=pending',
      icon: <ShoppingCart size={18} color="#0ea5e9" />,
      title: 'New Orders',
      titleColor: '#0369a1',
      bg: 'rgba(14, 165, 233, 0.1)',
      message: `${alerts.pendingOrders} new order(s) are waiting for seller action.`,
    },
    {
      show: alerts.openDisputes > 0,
      href: '/admin/disputes',
      icon: <AlertTriangle size={18} color="#ef4444" />,
      title: 'Open Disputes',
      titleColor: '#b91c1c',
      bg: 'rgba(239, 68, 68, 0.1)',
      message: `${alerts.openDisputes} order(s) have been disputed and require mediation.`,
    },
  ]

  const activeAlerts = alertCards.filter(card => card.show)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="section-title">Notifications & Support</h1>
          <p className="section-subtitle">Manage system alerts, buyer support tickets, and pending items.</p>
        </div>
      </div>

      {/* SYSTEM ALERTS ROW */}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-admin-border)' }}>
          <Bell size={18} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>System Alerts</h3>
        </div>

        {allClear ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', background: 'var(--color-success-bg)', borderRadius: '10px', justifyContent: 'center' }}>
            <CheckCircle size={20} color="var(--color-success)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>All caught up! No active system alerts require action.</span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {activeAlerts.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  background: 'var(--color-admin-surface)',
                  border: '1px solid var(--color-admin-border)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
                className="hover-card"
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: card.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {card.icon}
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: card.bg,
                      color: card.titleColor,
                      textTransform: 'uppercase'
                    }}>
                      Required
                    </span>
                  </div>
                  
                  <h4 style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.88rem', margin: '0 0 0.35rem 0' }}>
                    {card.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.45' }}>
                    {card.message}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginTop: '1.25rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: card.titleColor
                }}>
                  <span>Resolve issue</span>
                  <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* SUPPORT CENTER SECTION (FULL WIDTH) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.25rem' }}>
          <MessageSquare size={18} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Support Desk Center</h3>
        </div>
        <SupportInboxClient 
          initialConversations={initialConversations as any}
          adminUserId={user.id}
        />
      </div>

      {/* RECENT LISTINGS PENDING APPROVAL */}
      {pendingProducts.length > 0 && (
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Recent Listings Pending Approval</h3>
            </div>
            <Link href="/admin/products" className="admin-btn admin-btn-outline" style={{ fontSize: '0.8rem' }}>
              Review all →
            </Link>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '0.75rem'
          }}>
            {pendingProducts.map((p) => (
              <Link
                key={p.id}
                href="/admin/products"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--color-admin-bg)',
                  border: '1px solid var(--color-admin-border)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s'
                }}
                className="hover-card-border"
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                    by {p.shopperName || 'Unknown Shopper'}
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  {new Date(p.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

