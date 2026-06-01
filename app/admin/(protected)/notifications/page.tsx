import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { getAdminAlertCounts, getRecentPendingProducts, totalAlertCount } from '@/lib/data/admin-alerts'
import { Bell, MessageSquare, AlertTriangle, CheckCircle, Clock, Package, ShoppingCart, Megaphone, ShieldCheck, Wallet } from 'lucide-react'
import Link from 'next/link'

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
  const [alerts, pendingProducts, { data: messages }] = await Promise.all([
    getAdminAlertCounts(admin, user.id),
    getRecentPendingProducts(admin, 10),
    admin
      .from('messages')
      .select(`
      id, content, created_at, is_read,
      sender:profiles!messages_sender_id_fkey(full_name, role)
    `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

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
    {
      show: alerts.unreadSupportMessages > 0,
      href: '/admin/notifications',
      icon: <MessageSquare size={18} color="#10b981" />,
      title: 'Unread Support Messages',
      titleColor: '#047857',
      bg: 'rgba(16, 185, 129, 0.1)',
      message: `${alerts.unreadSupportMessages} unread message(s) in your support inbox below.`,
    },
  ]

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Notifications & Support</h1>
          <p className="section-subtitle">System alerts, new product listings, and buyer support messages</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <Bell size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>System Alerts</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alertCards.map(
              (card) =>
                card.show && (
                  <Link
                    key={card.title}
                    href={card.href}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '1rem',
                      background: card.bg,
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <span style={{ marginTop: '0.1rem' }}>{card.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: card.titleColor, marginBottom: '0.2rem' }}>{card.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{card.message}</div>
                    </div>
                  </Link>
                )
            )}

            {allClear && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', background: 'var(--color-bg-alt)', borderRadius: '8px', justifyContent: 'center' }}>
                <CheckCircle size={20} color="var(--color-success)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>All caught up! No active system alerts.</span>
              </div>
            )}
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Support Inbox</h3>
            </div>
            {alerts.unreadSupportMessages > 0 && (
              <span className="admin-badge badge-warning">{alerts.unreadSupportMessages} unread</span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {!messages || messages.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No messages in the support inbox.
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '1rem',
                    background: msg.is_read ? 'var(--color-bg-alt)' : 'rgba(99,102,241,0.05)',
                    borderRadius: '8px',
                    borderLeft: msg.is_read ? 'none' : '3px solid var(--color-primary)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{msg.sender?.full_name ?? 'Unknown User'}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {new Date(msg.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    {msg.sender?.role ?? 'User'}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{msg.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {pendingProducts.length > 0 && (
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Recent Listings Pending Approval</h3>
            </div>
            <Link href="/admin/products" className="admin-btn admin-btn-outline" style={{ fontSize: '0.8rem' }}>
              Review all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingProducts.map((p) => (
              <Link
                key={p.id}
                href="/admin/products"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  background: 'var(--color-bg-alt)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>by {p.shopperName}</div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
