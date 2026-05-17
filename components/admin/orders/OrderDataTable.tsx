'use client'

import { useState, useTransition, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { adminUpdateOrderStatus } from '@/lib/actions/admin'
import {
  Download, Printer, Package, ChevronDown,
  SlidersHorizontal, X, CheckSquare, Square, ExternalLink
} from 'lucide-react'

interface OrderRow {
  id: string
  productName: string | null
  buyerName: string
  shopperName: string
  amount: number
  status: string
  created_at: string
}

const ALL_STATUSES = ['pending', 'accepted', 'shipped', 'delivered', 'cancelled', 'disputed']

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered: 'badge-solid-success',
    pending:   'badge-solid-warning',
    disputed:  'badge-solid-danger',
    accepted:  'badge-solid-info',
    shipped:   'badge-solid-purple',
    cancelled: 'badge-solid-default',
  }
  return (
    <span className={`admin-badge ${map[status] ?? 'badge-default'}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.65rem' }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Print receipt for a single order ───────────────────────────────────────
function printOrder(order: OrderRow) {
  const win = window.open('', '_blank', 'width=600,height=700')
  if (!win) return
  win.document.write(`
    <html><head><title>Order Receipt — #${order.id.split('-')[0].toUpperCase()}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #1f2d3d; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .subtitle { color: #8c98b5; font-size: 13px; margin-bottom: 24px; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f1f5; font-size: 14px; }
      .label { color: #8c98b5; }
      .total { font-size: 18px; font-weight: 700; margin-top: 20px; text-align: right; }
      .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #eef0ff; color: #5f63f2; }
      @media print { button { display: none; } }
    </style></head><body>
    <h1>KelalShop — Order Receipt</h1>
    <div class="subtitle">Generated ${new Date().toLocaleString()}</div>
    <div class="row"><span class="label">Order ID</span><span>#${order.id.split('-')[0].toUpperCase()}</span></div>
    <div class="row"><span class="label">Date</span><span>${new Date(order.created_at).toLocaleString()}</span></div>
    <div class="row"><span class="label">Status</span><span class="badge">${order.status}</span></div>
    <div class="row"><span class="label">Product</span><span>${order.productName ?? 'Marketplace Items'}</span></div>
    <div class="row"><span class="label">Seller</span><span>${order.shopperName}</span></div>
    <div class="row"><span class="label">Buyer</span><span>${order.buyerName}</span></div>
    <div class="row"><span class="label">Shipping Ref</span><span>KELAL-${order.id.slice(-6).toUpperCase()}</span></div>
    <div class="total">Total: ETB ${Number(order.amount).toFixed(2)}</div>
    <br/><button onclick="window.print()" style="margin-top:20px;padding:10px 24px;background:#5f63f2;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨 Print</button>
    </body></html>
  `)
  win.document.close()
}

// ─── Export filtered rows to CSV ─────────────────────────────────────────────
function exportCSV(rows: OrderRow[]) {
  const headers = ['Order ID', 'Date', 'Status', 'Product', 'Seller', 'Buyer', 'Amount (ETB)', 'Shipping Ref']
  const csvRows = rows.map(r => [
    `#${r.id.split('-')[0].toUpperCase()}`,
    new Date(r.created_at).toLocaleString(),
    r.status,
    r.productName ?? 'Marketplace Items',
    r.shopperName,
    r.buyerName,
    Number(r.amount).toFixed(2),
    `KELAL-${r.id.slice(-6).toUpperCase()}`,
  ])
  const csv = [headers, ...csvRows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kelalshop-orders-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Single Order Card ────────────────────────────────────────────────────────
function OrderCard({
  order,
  selected,
  onToggleSelect,
}: {
  order: OrderRow
  selected: boolean
  onToggleSelect: () => void
}) {
  const router = useRouter()
  const [status, setStatus] = useState(order.status)
  const [pending, startTransition] = useTransition()

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value
    setStatus(next)
    startTransition(async () => {
      try {
        await adminUpdateOrderStatus(order.id, next)
      } catch {
        setStatus(order.status)
      }
    })
  }

  return (
    <div className="order-list-card" style={{ outline: selected ? '2px solid var(--color-accent-500)' : undefined }}>
      {/* Header */}
      <div className="order-list-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onToggleSelect}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: selected ? 'var(--color-accent-500)' : 'var(--color-text-muted)' }}
            title={selected ? 'Deselect' : 'Select'}
          >
            {selected ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Order <span style={{ color: 'var(--color-text-secondary)' }}>#{order.id.split('-')[0].toUpperCase()}</span>
          </h3>
          <StatusBadge status={status} />
          {pending && <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Saving…</span>}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          ETB {Number(order.amount).toFixed(2)}
        </div>
      </div>

      {/* Body */}
      <div className="order-list-body">
        <div style={{
          width: '70px', height: '70px', borderRadius: '8px',
          background: 'var(--color-admin-elevated)', border: '1px solid var(--color-admin-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Package size={24} color="var(--color-text-muted)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
            {order.productName ?? 'Custom Marketplace Request / Assorted Items'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <div><span style={{ color: 'var(--color-text-muted)' }}>Seller:</span> {order.shopperName}</div>
            <div><span style={{ color: 'var(--color-text-muted)' }}>Buyer:</span> {order.buyerName}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="order-list-footer">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Date: </span>
            {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Shipping Ref: </span>
            <span style={{ color: 'var(--color-info)', fontWeight: 500 }}>KELAL-{order.id.slice(-6).toUpperCase()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Status selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={status}
              onChange={handleStatusChange}
              disabled={pending}
              style={{
                appearance: 'none',
                padding: '0.4rem 1.75rem 0.4rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--color-admin-border)',
                background: 'var(--color-admin-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: pending ? 0.6 : 1,
              }}
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
          </div>

          {/* Print */}
          <button
            className="admin-btn admin-btn-outline"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => printOrder(order)}
          >
            <Printer size={14} /> Print
          </button>

          {/* View Details */}
          <button
            className="admin-btn admin-btn-primary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => router.push(`/admin/orders/${order.id}`)}
          >
            <ExternalLink size={13} /> View Details
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Panel ────────────────────────────────────────────────────────────
function FilterPanel({
  statusFilter, setStatusFilter,
  minAmount, setMinAmount,
  maxAmount, setMaxAmount,
  onClose,
}: {
  statusFilter: string; setStatusFilter: (v: string) => void
  minAmount: string; setMinAmount: (v: string) => void
  maxAmount: string; setMaxAmount: (v: string) => void
  onClose: () => void
}) {
  return (
    <div style={{
      background: 'var(--color-admin-surface)',
      border: '1px solid var(--color-admin-border)',
      borderRadius: '10px',
      padding: '1.25rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
    }}>
      <div>
        <label className="admin-label">Status</label>
        <select
          className="admin-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="admin-label">Min Amount (ETB)</label>
        <input className="admin-input" type="number" placeholder="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} />
      </div>
      <div>
        <label className="admin-label">Max Amount (ETB)</label>
        <input className="admin-input" type="number" placeholder="Any" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
        <button className="admin-btn admin-btn-outline" style={{ flex: 1 }} onClick={() => {
          setStatusFilter('all'); setMinAmount(''); setMaxAmount('')
        }}>Reset</button>
        <button className="admin-btn admin-btn-primary" style={{ flex: 1 }} onClick={onClose}>Apply</button>
      </div>
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function OrderDataTable({ rows }: { rows: OrderRow[] }) {
  const [tabFilter, setTabFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('delivered')
  const [bulkPending, startBulkTransition] = useTransition()
  const router = useRouter()

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const effectiveStatus = tabFilter !== 'all' ? tabFilter : statusFilter
      const matchStatus = effectiveStatus === 'all' || r.status === effectiveStatus
      const matchSearch = search === '' ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.buyerName.toLowerCase().includes(search.toLowerCase()) ||
        r.shopperName.toLowerCase().includes(search.toLowerCase()) ||
        (r.productName ?? '').toLowerCase().includes(search.toLowerCase())
      const matchMin = minAmount === '' || Number(r.amount) >= Number(minAmount)
      const matchMax = maxAmount === '' || Number(r.amount) <= Number(maxAmount)
      return matchStatus && matchSearch && matchMin && matchMax
    })
  }, [rows, tabFilter, statusFilter, search, minAmount, maxAmount])

  const counts = {
    all: rows.length,
    pending: rows.filter(r => r.status === 'pending').length,
    delivered: rows.filter(r => r.status === 'delivered').length,
    disputed: rows.filter(r => r.status === 'disputed').length,
  }

  const allSelected = filteredRows.length > 0 && filteredRows.every(r => selected.has(r.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredRows.map(r => r.id)))
    }
  }

  const applyBulkStatus = () => {
    startBulkTransition(async () => {
      await Promise.all([...selected].map(id => adminUpdateOrderStatus(id, bulkStatus)))
      setSelected(new Set())
      router.refresh()
    })
  }

  const tabStyle = (key: string) => ({
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: 'none', border: 'none',
    padding: '0.5rem 0',
    marginBottom: '-1px',
    borderBottom: tabFilter === key ? '2px solid var(--color-primary-button)' : '2px solid transparent',
    cursor: 'pointer',
    color: tabFilter === key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    fontWeight: tabFilter === key ? 600 : 500,
    fontSize: '0.875rem',
    transition: 'color 0.15s',
  } as React.CSSProperties)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-admin-border)', paddingBottom: '0' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {([
            { key: 'all',       label: 'All',       count: counts.all,       color: 'var(--color-info)' },
            { key: 'pending',   label: 'Pending',   count: counts.pending,   color: 'var(--color-warning)' },
            { key: 'delivered', label: 'Delivered', count: counts.delivered, color: 'var(--color-purple)' },
            { key: 'disputed',  label: 'Disputed',  count: counts.disputed,  color: 'var(--color-danger)' },
          ] as const).map(tab => (
            <button key={tab.key} style={tabStyle(tab.key)} onClick={() => setTabFilter(tab.key)}>
              {tab.label}
              <span className="count-pill" style={{ background: tab.color }}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.5rem' }}>
          <button className="admin-btn admin-btn-outline" onClick={() => exportCSV(filteredRows)}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by Order ID, Buyer, Seller, or Product…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="admin-input"
          style={{ flex: '1 1 220px', maxWidth: '400px' }}
        />
        <button
          className={`admin-btn ${showFilters ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <SlidersHorizontal size={14} />
          Filters
          {(statusFilter !== 'all' || minAmount || maxAmount) && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: showFilters ? '#fff' : 'var(--color-danger)', marginLeft: '2px' }} />
          )}
        </button>
        {(statusFilter !== 'all' || minAmount || maxAmount) && (
          <button className="admin-btn admin-btn-ghost" onClick={() => { setStatusFilter('all'); setMinAmount(''); setMaxAmount('') }}>
            <X size={14} /> Clear filters
          </button>
        )}
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {filteredRows.length} order{filteredRows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {showFilters && (
        <FilterPanel
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          minAmount={minAmount} setMinAmount={setMinAmount}
          maxAmount={maxAmount} setMaxAmount={setMaxAmount}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          padding: '0.875rem 1.25rem', borderRadius: '10px',
          background: 'var(--color-info-bg)', border: '1px solid rgba(95,99,242,0.2)'
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-info)' }}>
            {selected.size} order{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Set status to:</label>
            <select
              className="admin-input"
              style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
            >
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <button
              className="admin-btn admin-btn-primary"
              disabled={bulkPending}
              onClick={applyBulkStatus}
              style={{ padding: '0.4rem 0.85rem' }}
            >
              {bulkPending ? 'Applying…' : 'Apply'}
            </button>
          </div>
          <button className="admin-btn admin-btn-ghost" onClick={() => setSelected(new Set())}>
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {/* Select All row */}
      {filteredRows.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.25rem' }}>
          <button
            onClick={toggleAll}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: allSelected ? 'var(--color-accent-500)' : 'var(--color-text-muted)' }}
          >
            {allSelected ? <CheckSquare size={17} /> : <Square size={17} />}
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {allSelected ? 'Deselect all' : 'Select all visible'}
          </span>
        </div>
      )}

      {/* Order Cards */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filteredRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
            No orders found matching your criteria.
          </div>
        ) : (
          filteredRows.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              selected={selected.has(order.id)}
              onToggleSelect={() => setSelected(prev => {
                const next = new Set(prev)
                next.has(order.id) ? next.delete(order.id) : next.add(order.id)
                return next
              })}
            />
          ))
        )}
      </div>
    </div>
  )
}
