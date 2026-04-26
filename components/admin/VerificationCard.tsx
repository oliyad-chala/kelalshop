'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, ExternalLink, User, Building2, Clock } from 'lucide-react'
import { approveVerification, rejectVerification } from '@/lib/actions/admin'

interface VerificationCardProps {
  shopperId: string
  fullName: string | null
  businessName: string | null
  createdAt: string
  idFrontUrl: string | null
  idBackUrl: string | null
}

export function VerificationCard({
  shopperId,
  fullName,
  businessName,
  createdAt,
  idFrontUrl,
  idBackUrl,
}: VerificationCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  const handle = (action: 'approve' | 'reject') => {
    setError(null)
    startTransition(async () => {
      try {
        if (action === 'approve') await approveVerification(shopperId)
        else await rejectVerification(shopperId)
        setDone(action === 'approve' ? 'approved' : 'rejected')
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong')
      }
    })
  }

  if (done) {
    return (
      <div className="verify-card" style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1.25rem',
        borderColor: done === 'approved' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.3)',
      }}>
        {done === 'approved'
          ? <CheckCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          : <XCircle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />}
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>{fullName ?? 'Shopper'}</strong>{' '}
          has been <strong>{done}</strong>.
        </span>
      </div>
    )
  }

  return (
    <div className="verify-card fade-in">
      {/* Header */}
      <div className="verify-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
          <div style={{
            width: '2.25rem', height: '2.25rem', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: '#fff',
          }}>
            {fullName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={12} style={{ color: 'var(--color-text-muted)' }} />
              {fullName ?? 'Unknown'}
            </div>
            {businessName && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                <Building2 size={11} />
                {businessName}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Clock size={11} />
          {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* ID Document images */}
      <div className="verify-card-docs">
        <div className="verify-card-doc">
          {idFrontUrl ? (
            <>
              <img src={idFrontUrl} alt="ID Front" />
              <a
                href={idFrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  position: 'absolute', top: '0.5rem', right: '0.5rem',
                  background: 'rgba(0,0,0,0.55)', borderRadius: '4px',
                  padding: '0.2rem', display: 'flex', color: '#fff',
                }}
              >
                <ExternalLink size={12} />
              </a>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
              No document
            </div>
          )}
          <div className="verify-card-doc-label">Front / Main ID</div>
        </div>

        <div className="verify-card-doc">
          {idBackUrl ? (
            <>
              <img src={idBackUrl} alt="ID Back" />
              <a
                href={idBackUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  position: 'absolute', top: '0.5rem', right: '0.5rem',
                  background: 'rgba(0,0,0,0.55)', borderRadius: '4px',
                  padding: '0.2rem', display: 'flex', color: '#fff',
                }}
              >
                <ExternalLink size={12} />
              </a>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
              No back doc
            </div>
          )}
          <div className="verify-card-doc-label">Back / Secondary</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="admin-alert admin-alert-error" style={{ margin: '0.75rem 1.25rem 0' }}>
          <XCircle size={14} /> {error}
        </div>
      )}

      {/* Actions */}
      <div className="verify-card-actions">
        <button
          className="admin-btn admin-btn-success"
          disabled={isPending}
          onClick={() => handle('approve')}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <CheckCircle size={13} />
          {isPending ? 'Processing…' : 'Approve'}
        </button>
        <button
          className="admin-btn admin-btn-danger"
          disabled={isPending}
          onClick={() => handle('reject')}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <XCircle size={13} />
          {isPending ? 'Processing…' : 'Reject'}
        </button>
      </div>
    </div>
  )
}
