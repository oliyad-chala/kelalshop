'use client'

import { useState, useTransition, useCallback } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, Eye, Filter, X } from 'lucide-react'
import type { ActivityLog } from '@/lib/data/activity-logs'
import { ActivityLogDetailsModal } from './ActivityLogDetailsModal'
import { ACTION_META, ACTION_TYPE_OPTIONS, ENTITY_TYPE_OPTIONS } from './action-meta'

interface Props {
  initialLogs: ActivityLog[]
  initialCount: number
  initialPage: number
}

function ActionBadge({ actionType }: { actionType: string }) {
  const meta = ACTION_META[actionType] ?? { label: actionType, color: '#64748b', bg: '#f1f5f9' }
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '20px',
      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
      background: meta.bg, color: meta.color,
    }}>
      {meta.label}
    </span>
  )
}

export function ActivityLogsClient({ initialLogs, initialCount, initialPage }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs)
  const [count, setCount] = useState(initialCount)
  const [page, setPage] = useState(initialPage)
  const [search, setSearch] = useState('')
  const [actionType, setActionType] = useState('all')
  const [entityType, setEntityType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [pending, startTransition] = useTransition()

  const PER_PAGE = 20
  const totalPages = Math.max(1, Math.ceil(count / PER_PAGE))

  const fetchLogs = useCallback((newPage: number, params?: { search?: string; actionType?: string; entityType?: string; startDate?: string; endDate?: string }) => {
    startTransition(async () => {
      const p = params ?? { search, actionType, entityType, startDate, endDate }
      const qs = new URLSearchParams({
        page: String(newPage),
        ...(p.search ? { search: p.search } : {}),
        ...(p.actionType && p.actionType !== 'all' ? { actionType: p.actionType } : {}),
        ...(p.entityType && p.entityType !== 'all' ? { entityType: p.entityType } : {}),
        ...(p.startDate ? { startDate: p.startDate } : {}),
        ...(p.endDate ? { endDate: p.endDate } : {}),
      })
      const res = await fetch(`/api/admin/activity-logs?${qs}`)
      if (res.ok) {
        const json = await res.json()
        setLogs(json.logs)
        setCount(json.count)
        setPage(newPage)
      }
    })
  }, [search, actionType, entityType, startDate, endDate])

  const handleSearch = () => fetchLogs(1)

  const handleReset = () => {
    setSearch('')
    setActionType('all')
    setEntityType('all')
    setStartDate('')
    setEndDate('')
    fetchLogs(1, { search: '', actionType: 'all', entityType: 'all', startDate: '', endDate: '' })
  }

  const handleExportCSV = async () => {
    const qs = new URLSearchParams({
      export: '1',
      ...(search ? { search } : {}),
      ...(actionType !== 'all' ? { actionType } : {}),
      ...(entityType !== 'all' ? { entityType } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    })
    const res = await fetch(`/api/admin/activity-logs?${qs}`)
    if (!res.ok) return
    const data: ActivityLog[] = await res.json()

    const header = 'ID,Admin,Action,Entity Type,Entity ID,Description,IP,Date\n'
    const rows = data.map(l =>
      [l.id, l.admin_name, l.action_type, l.entity_type ?? '', l.entity_id ?? '',
        `"${l.description.replace(/"/g, '""')}"`, l.ip_address ?? '', l.created_at].join(',')
    ).join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="admin-input"
              placeholder="Search admin / description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <select className="admin-input" value={actionType} onChange={e => setActionType(e.target.value)}>
            {ACTION_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="admin-input" value={entityType} onChange={e => setEntityType(e.target.value)}>
            {ENTITY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input className="admin-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} title="From date" />
          <input className="admin-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} title="To date" />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="admin-btn admin-btn-primary" onClick={handleSearch} disabled={pending} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} /> {pending ? 'Filtering…' : 'Apply Filters'}
          </button>
          <button className="admin-btn" onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <X size={14} /> Reset
          </button>
          <div style={{ flex: 1 }} />
          <button className="admin-btn" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={14} /> Export CSV
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {count.toLocaleString()} result{count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
              {['Timestamp', 'Admin', 'Action', 'Entity', 'Description', ''].map(h => (
                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr
                key={log.id}
                onClick={() => setSelectedLog(log)}
                style={{ borderBottom: '1px solid var(--color-admin-border)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-admin-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent-600)', flexShrink: 0 }}>
                      {log.admin_name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{log.admin_name}</span>
                  </div>
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <ActionBadge actionType={log.action_type} />
                </td>
                <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                  {log.entity_type ?? '—'}
                </td>
                <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.description}
                </td>
                <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedLog(log) }}
                    className="admin-btn"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Eye size={13} /> View
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button className="admin-btn" onClick={() => fetchLogs(page - 1)} disabled={page <= 1 || pending}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', padding: '0 0.5rem' }}>
            Page {page} of {totalPages}
          </span>
          <button className="admin-btn" onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages || pending}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <ActivityLogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  )
}
