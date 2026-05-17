'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { adminUpdateOrderStatus } from '@/lib/actions/admin'

export function DisputeActions({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleResolve = async (action: 'refund' | 'resolve') => {
    setError(null)
    const newStatus = action === 'refund' ? 'cancelled' : 'delivered'
    const msg = action === 'refund' 
      ? 'Are you sure you want to rule in favor of the buyer and ISSUE A REFUND? This will mark the order as cancelled.'
      : 'Are you sure you want to rule in favor of the seller and RESOLVE the dispute? This will mark the order as delivered.'
    
    if (!confirm(msg)) return;

    startTransition(async () => {
      try {
        await adminUpdateOrderStatus(orderId, newStatus)
        setDone(true)
      } catch (e: any) {
        setError(e.message ?? 'Action failed')
      }
    })
  }

  if (done) {
    return (
      <div className="admin-alert admin-alert-success" style={{ marginBottom: '1rem' }}>
        <CheckCircle size={14} /> Dispute has been resolved and order status updated.
      </div>
    )
  }

  return (
    <div className="admin-card" style={{ marginBottom: '1.25rem', background: 'var(--color-bg-alt)' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 600 }}>Dispute Resolution Actions</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Review the evidence below. You can rule in favor of the buyer (Refund) or seller (Resolve & Complete).
      </p>
      
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          className="admin-btn admin-btn-primary"
          disabled={pending}
          onClick={() => handleResolve('resolve')}
          style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', color: 'white' }}
        >
          <CheckCircle size={14} /> Rule for Seller (Resolve)
        </button>
        <button
          className="admin-btn admin-btn-danger"
          disabled={pending}
          onClick={() => handleResolve('refund')}
        >
          <RefreshCw size={14} /> Rule for Buyer (Refund)
        </button>
      </div>

      {error && <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.75rem', display: 'block' }}>{error}</span>}
    </div>
  )
}
