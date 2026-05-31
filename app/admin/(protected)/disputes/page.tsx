import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { MessageSquare, Search, AlertOctagon, ArrowLeft } from 'lucide-react'
import { DisputeActions } from '@/components/admin/disputes/DisputeActions'
import Link from 'next/link'

export const metadata = { title: 'Dispute Center' }

interface SearchParams { order_id?: string; request_id?: string }

function MessageBubble({ msg }: { msg: any }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.2rem',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid var(--color-admin-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '1.6rem', height: '1.6rem', borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {(msg.sender_name ?? '?').charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {msg.sender_name ?? 'Unknown'}
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p style={{ margin: 0, paddingLeft: '2.1rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        {msg.content}
      </p>
      {msg.image_url && (
        <div style={{ paddingLeft: '2.1rem' }}>
          <img
            src={msg.image_url}
            alt="Attachment"
            style={{ maxWidth: '240px', borderRadius: '6px', border: '1px solid var(--color-admin-border)', marginTop: '0.35rem' }}
          />
        </div>
      )}
    </div>
  )
}

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) redirect('/admin/dashboard')

  const sp = await searchParams
  const orderId   = sp.order_id?.trim()   || null
  const requestId = sp.request_id?.trim() || null

  const admin = createAdminClient()

  let messages: any[] = []
  let contextLabel = ''

  if (orderId || requestId) {
    const query = admin
      .from('messages')
      .select(`id, content, image_url, created_at, sender_id, order_id, request_id, profiles!messages_sender_id_fkey(full_name)`)
      .order('created_at', { ascending: true })

    if (orderId)   query.eq('order_id', orderId)
    if (requestId) query.eq('request_id', requestId)

    const { data } = await query
    messages = (data ?? []).map((m: any) => ({
      ...m,
      sender_name: m.profiles?.full_name ?? '—',
    }))
    contextLabel = orderId ? `Order #${orderId.slice(0, 8)}` : `Request #${requestId!.slice(0, 8)}`
    
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <Link href="/admin/disputes" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <ArrowLeft size={14} /> Back to Disputes
            </Link>
            <h1 className="section-title">Dispute Resolution</h1>
            <p className="section-subtitle">Review evidence and resolve the dispute for {contextLabel}</p>
          </div>
        </div>

        {orderId && <DisputeActions orderId={orderId} />}

        <div className="data-table-wrap">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              <MessageSquare size={14} style={{ color: 'var(--color-accent-400)' }} />
              Chat Evidence — <strong style={{ color: 'var(--color-text-primary)' }}>{contextLabel}</strong>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          </div>

          {messages.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
              No messages found for this ID.
            </div>
          ) : (
            <div>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // If no orderId/requestId, show the queue of disputed orders
  const { data: disputedOrders } = await admin
    .from('orders')
    .select(`
      id, amount, created_at, status,
      buyer:profiles!orders_buyer_id_fkey(full_name),
      shopper:profiles!orders_shopper_id_fkey(full_name)
    `)
    .eq('status', 'disputed')
    .order('updated_at', { ascending: false })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Dispute Center</h1>
          <p className="section-subtitle">Manage escalated buyer vs seller disputes and issue refunds</p>
        </div>
        {disputedOrders && disputedOrders.length > 0 && (
          <span className="admin-badge badge-danger">{disputedOrders.length} Open Disputes</span>
        )}
      </div>

      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Active Dispute Queue</h3>
        {(!disputedOrders || disputedOrders.length === 0) ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <AlertOctagon size={36} style={{ color: 'var(--color-success)', margin: '0 auto 1rem', opacity: 0.5 }} />
            <div style={{ fontSize: '0.9rem' }}>No open disputes at the moment. All clear!</div>
          </div>
        ) : (
          <div className="data-table-wrap" style={{ margin: '-1.25rem', marginTop: '0', border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {disputedOrders.map((o: any) => (
                  <tr key={o.id}>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{o.id.slice(0, 8).toUpperCase()}</td>
                    <td>{o.buyer?.full_name ?? '—'}</td>
                    <td>{o.shopper?.full_name ?? '—'}</td>
                    <td>ETB {Number(o.amount).toFixed(2)}</td>
                    <td>
                      <Link href={`/admin/disputes?order_id=${o.id}`} className="admin-btn admin-btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        Review & Resolve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 600 }}>Manual Lookup</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Enter an Order ID or Request ID below to view the conversation thread.</p>
        <form style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label className="admin-label" htmlFor="disp-order">Order ID</label>
            <input
              id="disp-order"
              name="order_id"
              className="admin-input"
              defaultValue={orderId ?? ''}
              placeholder="e.g. 3fa85f64-5717…"
            />
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label className="admin-label" htmlFor="disp-req">Request ID</label>
            <input
              id="disp-req"
              name="request_id"
              className="admin-input"
              defaultValue={requestId ?? ''}
              placeholder="e.g. 8d2a0f1b-4c39…"
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
            <Search size={13} /> View Thread
          </button>
        </form>
      </div>
    </div>
  )
}
