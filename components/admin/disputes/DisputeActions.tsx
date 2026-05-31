'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { adminUpdateOrderStatus } from '@/lib/actions/admin'

import { ConfirmModal } from '@/components/ui/ConfirmModal'

export function DisputeActions({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    action: 'refund' | 'resolve' | null
  }>({ isOpen: false, action: null })

  const handleConfirm = () => {
    const action = modalConfig.action
    setModalConfig({ ...modalConfig, isOpen: false })
    if (!action) return

    setError(null)
    const newStatus = action === 'refund' ? 'cancelled' : 'delivered'

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

  const isRefund = modalConfig.action === 'refund'

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
          onClick={() => setModalConfig({ isOpen: true, action: 'resolve' })}
          style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', color: 'white' }}
        >
          <CheckCircle size={14} /> Rule for Seller (Resolve)
        </button>
        <button
          className="admin-btn admin-btn-danger"
          disabled={pending}
          onClick={() => setModalConfig({ isOpen: true, action: 'refund' })}
        >
          <RefreshCw size={14} /> Rule for Buyer (Refund)
        </button>
      </div>

      {error && <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.75rem', display: 'block' }}>{error}</span>}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, action: null })}
        onConfirm={handleConfirm}
        title={isRefund ? 'Rule for Buyer (Refund)' : 'Rule for Seller (Resolve)'}
        message={isRefund 
          ? 'Are you sure you want to rule in favor of the buyer and ISSUE A REFUND? This will mark the order as cancelled.'
          : 'Are you sure you want to rule in favor of the seller and RESOLVE the dispute? This will mark the order as delivered.'}
        confirmText={isRefund ? 'Refund Buyer' : 'Resolve Dispute'}
        variant={isRefund ? 'danger' : 'success'}
        isLoading={pending}
      />
    </div>
  )
}
