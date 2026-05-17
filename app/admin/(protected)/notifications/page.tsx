import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Notifications & Support' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  // Fetch pending items for "System Alerts"
  const [
    { count: pendingVerifications },
    { count: pendingPayments },
    { count: openDisputes }
  ] = await Promise.all([
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    admin.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
  ])

  // Fetch support messages (messages sent to the admin)
  const { data: messages } = await admin
    .from('messages')
    .select(`
      id, content, created_at, is_read,
      sender:profiles!messages_sender_id_fkey(full_name, role)
    `)
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Notifications & Support</h1>
          <p className="section-subtitle">System alerts, admin-to-seller messaging, and buyer support tickets</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* System Alerts */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <Bell size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>System Alerts</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Number(pendingVerifications) > 0 ? (
              <Link href="/admin/verifications" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                <AlertTriangle size={18} color="#f59e0b" style={{ marginTop: '0.1rem' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#b45309', marginBottom: '0.2rem' }}>Action Required</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>You have {pendingVerifications} pending seller verifications to review.</div>
                </div>
              </Link>
            ) : null}

            {Number(pendingPayments) > 0 ? (
              <Link href="/admin/payouts" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                <Clock size={18} color="#3b82f6" style={{ marginTop: '0.1rem' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: '0.2rem' }}>Pending Payments</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>There are {pendingPayments} manual payments waiting for approval.</div>
                </div>
              </Link>
            ) : null}

            {Number(openDisputes) > 0 ? (
              <Link href="/admin/disputes" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                <AlertTriangle size={18} color="#ef4444" style={{ marginTop: '0.1rem' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#b91c1c', marginBottom: '0.2rem' }}>Open Disputes</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{openDisputes} order(s) have been disputed and require mediation.</div>
                </div>
              </Link>
            ) : null}

            {Number(pendingVerifications) === 0 && Number(pendingPayments) === 0 && Number(openDisputes) === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', background: 'var(--color-bg-alt)', borderRadius: '8px', justifyContent: 'center' }}>
                <CheckCircle size={20} color="var(--color-success)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>All caught up! No active system alerts.</span>
              </div>
            )}
          </div>
        </div>

        {/* Support Messages */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Support Inbox</h3>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {!messages || messages.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No messages in the support inbox.
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{ padding: '1rem', background: msg.is_read ? 'var(--color-bg-alt)' : 'rgba(99,102,241,0.05)', borderRadius: '8px', borderLeft: msg.is_read ? 'none' : '3px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{msg.sender?.full_name ?? 'Unknown User'}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
    </div>
  )
}
