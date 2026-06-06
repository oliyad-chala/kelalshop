import Link from 'next/link'
import { Activity, Clock, ShieldAlert, ArrowRight, User } from 'lucide-react'
import type { ActivityLogStats } from '@/lib/data/activity-log-stats'
import { ACTION_META } from './activity-logs/action-meta'

export function DashboardActivityWidget({ stats }: { stats: ActivityLogStats }) {
  return (
    <div className="admin-card fade-in" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem', borderBottom: '1px solid var(--color-admin-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--color-admin-bg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--color-info-bg)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Activity size={16} color="var(--color-accent-600)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Activity Log
            </h3>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Latest admin actions
            </p>
          </div>
        </div>
        <Link
          href="/admin/activity-logs"
          className="admin-btn"
          style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          View All <ArrowRight size={13} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'var(--color-admin-border)' }}>
        <div style={{ padding: '1.25rem', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Clock size={14} color="#94a3b8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {stats.todayCount.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '1.25rem', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Activity size={14} color="#94a3b8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Week</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {stats.weekCount.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '1.25rem', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <User size={14} color="#94a3b8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Active</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stats.mostActiveAdmin?.name ?? '—'}
          </div>
          {stats.mostActiveAdmin && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {stats.mostActiveAdmin.count} actions
            </div>
          )}
        </div>
      </div>

      {/* Recent Feed */}
      <div style={{ padding: '0', flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
        {stats.recentLogs.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <ShieldAlert size={24} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>No recent activity to display.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stats.recentLogs.map((log, i) => {
              const meta = ACTION_META[log.action_type] ?? { label: log.action_type, color: '#64748b', bg: '#f1f5f9' }
              const isLast = i === stats.recentLogs.length - 1

              return (
                <Link
                  key={log.id}
                  href={`/admin/activity-logs?search=${log.id}`}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                    padding: '1rem 1.25rem', textDecoration: 'none',
                    borderBottom: isLast ? 'none' : '1px solid var(--color-admin-border)',
                    transition: 'background 0.15s',
                  }}
                  className="hover-bg-slate-50"
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: meta.bg, color: meta.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 700,
                  }}>
                    {log.admin_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {log.admin_name}
                      </span>
                      <span style={{
                        display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px',
                        fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap',
                        background: meta.bg, color: meta.color,
                      }}>
                        {meta.label}
                      </span>
                    </div>
                    <p style={{
                      margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {log.description}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
