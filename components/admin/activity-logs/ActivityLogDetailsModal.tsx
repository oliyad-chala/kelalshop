'use client'

import { useEffect, useRef } from 'react'
import { X, User, Calendar, Globe, Tag, FileText, ArrowRight } from 'lucide-react'
import type { ActivityLog } from '@/lib/data/activity-logs'
import { ACTION_META } from './action-meta'

interface Props {
  log: ActivityLog | null
  onClose: () => void
}

function JsonDiff({ label, data }: { label: string; data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) return null
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
        {label}
      </div>
      <pre style={{
        background: label === 'Before' ? '#fff1f2' : '#f0fdf4',
        border: `1px solid ${label === 'Before' ? '#fecdd3' : '#bbf7d0'}`,
        borderRadius: '8px', padding: '0.75rem',
        fontSize: '0.8rem', overflowX: 'auto', margin: 0,
        color: label === 'Before' ? '#9f1239' : '#166534',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export function ActivityLogDetailsModal({ log, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!log) return null

  const meta = ACTION_META[log.action_type] ?? { label: log.action_type, color: '#64748b', bg: '#f1f5f9' }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        animation: 'fadeInUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0f1f5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              display: 'inline-block', padding: '0.3rem 0.75rem', borderRadius: '20px',
              fontSize: '0.78rem', fontWeight: 700,
              background: meta.bg, color: meta.color,
            }}>
              {meta.label}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Log Detail</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem', borderRadius: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Description */}
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <FileText size={15} color="#64748b" style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.5 }}>{log.description}</p>
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { icon: User, label: 'Admin', value: log.admin_name },
              { icon: Tag, label: 'Entity', value: log.entity_type ? `${log.entity_type}${log.entity_id ? ` (${log.entity_id.slice(0,8)}…)` : ''}` : '—' },
              { icon: Calendar, label: 'Timestamp', value: new Date(log.created_at).toLocaleString() },
              { icon: Globe, label: 'IP Address', value: log.ip_address ?? '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                  <Icon size={13} color="#94a3b8" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b', wordBreak: 'break-all' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* JSON diff */}
          {(log.old_data || log.new_data) && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Data Changes
                <ArrowRight size={14} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <JsonDiff label="Before" data={log.old_data} />
                <JsonDiff label="After" data={log.new_data} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
