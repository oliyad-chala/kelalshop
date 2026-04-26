import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare, Search } from 'lucide-react'

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
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Dispute Center</h1>
          <p className="section-subtitle">View message threads for a specific order or request to resolve conflicts</p>
        </div>
      </div>

      {/* Search */}
      <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
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
            <Search size={13} /> Search
          </button>
        </form>
      </div>

      {/* Results */}
      {(orderId || requestId) && (
        <div className="data-table-wrap">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              <MessageSquare size={14} style={{ color: 'var(--color-accent-400)' }} />
              Thread — <strong style={{ color: 'var(--color-text-primary)' }}>{contextLabel}</strong>
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
      )}

      {!orderId && !requestId && (
        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <MessageSquare size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Enter an Order ID or Request ID above to view the conversation thread.
          </div>
        </div>
      )}
    </div>
  )
}
