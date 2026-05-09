'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, ExternalLink, User, Building2, Clock, ZoomIn } from 'lucide-react'
import { approveVerification, rejectVerification } from '@/lib/actions/admin'

interface VerificationCardProps {
  shopperId: string
  fullName: string | null
  businessName: string | null
  createdAt: string
  idFrontUrl: string | null
  idBackUrl: string | null
}

function ImageLightbox({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt={label}
          style={{
            maxWidth: '90vw', maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: '10px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        />
        <div style={{
          position: 'absolute', bottom: '-2.5rem', left: 0, right: 0,
          textAlign: 'center', color: '#a1a1aa', fontSize: '0.8rem', fontWeight: 500,
        }}>
          {label}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%', width: '2.5rem', height: '2.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1,
        }}
      >
        ×
      </button>
      <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '3.5rem' }}>
        Click outside or press × to close
      </p>
    </div>
  )
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
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null)

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
    <>
      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          label={lightbox.label}
          onClose={() => setLightbox(null)}
        />
      )}

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

        {/* ID Document images — click to zoom */}
        <div className="verify-card-docs">
          {[
            { url: idFrontUrl, label: 'Front / Main ID' },
            { url: idBackUrl, label: 'Back / Secondary' },
          ].map(({ url, label }) => (
            <div
              key={label}
              className="verify-card-doc"
              onClick={() => url && setLightbox({ src: url, label })}
              style={{ cursor: url ? 'zoom-in' : 'default' }}
              title={url ? 'Click to enlarge' : undefined}
            >
              {url ? (
                <>
                  <img src={url} alt={label} />
                  <div style={{
                    position: 'absolute', top: '0.5rem', right: '0.5rem',
                    background: 'rgba(0,0,0,0.55)', borderRadius: '4px',
                    padding: '0.25rem', display: 'flex', color: '#fff',
                    gap: '0.2rem',
                  }}>
                    <ZoomIn size={12} />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                  No document
                </div>
              )}
              <div className="verify-card-doc-label">{label}</div>
            </div>
          ))}
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
    </>
  )
}
