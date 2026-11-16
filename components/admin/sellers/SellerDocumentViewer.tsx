'use client'

import { useState } from 'react'
import { ZoomIn, ExternalLink, FileText, X } from 'lucide-react'

interface SellerDocumentViewerProps {
  frontUrl: string | null
  backUrl: string | null
}

function DocumentLightbox({
  src,
  label,
  onClose,
}: {
  src: string
  label: string
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={label}
          style={{
            maxWidth: '90vw',
            maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: '10px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-2.5rem',
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#a1a1aa',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          {label}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '2.5rem',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <X size={20} />
      </button>

      <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '3.5rem' }}>
        Click outside or press × to close
      </p>
    </div>
  )
}

export function SellerDocumentViewer({ frontUrl, backUrl }: SellerDocumentViewerProps) {
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null)

  const docs = [
    { label: 'ID Document (Front)', url: frontUrl, sublabel: 'Primary National ID / Passport' },
    { label: 'ID Document (Back)', url: backUrl, sublabel: 'Back Side / Address' },
  ]

  return (
    <div>
      {lightbox && (
        <DocumentLightbox
          src={lightbox.src}
          label={lightbox.label}
          onClose={() => setLightbox(null)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {docs.map((doc) => (
          <div key={doc.label} style={{ marginBottom: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '0.4rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {doc.label}
              </span>
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Open in New Tab <ExternalLink size={11} />
                </a>
              )}
            </div>

            {doc.url ? (
              <div
                onClick={() => setLightbox({ src: doc.url!, label: doc.label })}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 10',
                  maxHeight: '220px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                  cursor: 'zoom-in',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                }}
                className="hover:border-amber-400 group"
              >
                <img
                  src={doc.url}
                  alt={doc.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '0.3rem 0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                  }}
                >
                  <ZoomIn size={12} />
                  <span>Enlarge</span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '1rem',
                  background: 'var(--color-bg-alt)',
                  borderRadius: '8px',
                  border: '1px dashed var(--color-border)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.8rem',
                }}
              >
                <FileText size={16} />
                <span>No document uploaded.</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
