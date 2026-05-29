'use client'

import { useState, useTransition, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { ToggleLeft, ToggleRight, Eye, Edit2, ShieldAlert, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { toggleProductAvailability, adminToggleProductBoost, adminDeleteProduct, adminApproveProduct, adminRejectProduct } from '@/lib/actions/admin'
import Link from 'next/link'
import { DeleteProductButton } from '@/components/products/DeleteProductButton'

interface ProductRow {
  id: string
  name: string
  shopperName: string
  price: number
  stock: number
  category: string
  is_available: boolean
  is_featured: boolean
  boosted_until: string | null
  created_at: string
  approval_status: 'pending' | 'approved' | 'rejected'
  approval_notes: string | null
}

function AvailabilityToggle({ productId, initial }: { productId: string; initial: boolean }) {
  const [enabled, setEnabled] = useState(initial)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      try {
        await toggleProductAvailability(productId, next)
      } catch {
        setEnabled(!next) // revert
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: enabled ? 'var(--color-success)' : 'var(--color-danger)',
        fontSize: '0.78rem', fontWeight: 500,
        padding: '0.25rem 0',
        opacity: pending ? 0.6 : 1,
        transition: 'color 0.15s',
      }}
    >
      {enabled
        ? <ToggleRight size={16} className="text-green-500" style={{ flexShrink: 0 }} />
        : <ToggleLeft size={16} className="text-slate-400" style={{ flexShrink: 0 }} />}
      <span className={enabled ? 'text-green-700' : 'text-slate-500'}>{enabled ? 'Active' : 'Hidden'}</span>
    </button>
  )
}

function BoostToggle({ productId, isFeatured, boostedUntil }: { productId: string; isFeatured: boolean; boostedUntil: string | null }) {
  const isCurrentlyBoosted = isFeatured && boostedUntil && new Date(boostedUntil) > new Date()
  const [enabled, setEnabled] = useState(!!isCurrentlyBoosted)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      try {
        await adminToggleProductBoost(productId, next)
      } catch {
        setEnabled(!next) // revert
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: enabled ? 'var(--color-warning)' : 'var(--color-text-muted)',
        fontSize: '0.78rem', fontWeight: 500,
        padding: '0.25rem 0',
        opacity: pending ? 0.6 : 1,
        transition: 'color 0.15s',
      }}
    >
      {enabled
        ? <ToggleRight size={16} className="text-amber-500" style={{ flexShrink: 0 }} />
        : <ToggleLeft size={16} className="text-slate-400" style={{ flexShrink: 0 }} />}
      <span className={enabled ? 'text-amber-700' : 'text-slate-500'}>{enabled ? 'Featured' : 'Standard'}</span>
    </button>
  )
}

function ApprovalActions({ productId, currentStatus, reason }: { productId: string, currentStatus: string, reason: string | null }) {
  const [pending, startTransition] = useTransition()

  const handleApprove = () => {
    startTransition(async () => {
      await adminApproveProduct(productId)
    })
  }

  const handleReject = () => {
    const r = window.prompt('Enter rejection reason:')
    if (r !== null) {
      startTransition(async () => {
        await adminRejectProduct(productId, r || 'No reason provided')
      })
    }
  }

  if (currentStatus === 'pending') {
    return (
      <div className="flex gap-2 items-center">
        <button onClick={handleApprove} disabled={pending} className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1">
          <CheckCircle2 size={14} /> Approve
        </button>
        <button onClick={handleReject} disabled={pending} className="text-xs font-medium px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 flex items-center gap-1">
          <XCircle size={14} /> Reject
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider w-max ${currentStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
        {currentStatus === 'approved' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        {currentStatus}
      </span>
      {currentStatus === 'rejected' && reason && (
        <span className="text-[10px] text-rose-600 max-w-[150px] leading-tight bg-rose-50 p-1 rounded border border-rose-100 line-clamp-2" title={reason}>{reason}</span>
      )}
    </div>
  )
}

const columns: ColumnDef<ProductRow, any>[] = [
  {
    id: 'product_details',
    header: 'Product Details',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 text-sm">{row.original.name}</span>
          <Link href={`/products/${row.original.id}`} target="_blank" className="text-slate-400 hover:text-slate-600 transition-colors" title="View on marketplace">
            <Eye size={14} />
          </Link>
        </div>
        <span className="text-xs text-slate-500 mt-0.5">
          {row.original.category} • by <span className="font-medium text-slate-700">{row.original.shopperName}</span>
        </span>
      </div>
    ),
  },
  {
    id: 'price_stock',
    header: 'Price & Stock',
    cell: ({ row }) => {
      const stock = Number(row.original.stock)
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-slate-900 text-sm">ETB {Number(row.original.price).toLocaleString()}</span>
          {stock === 0 ? (
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Out of Stock</span>
          ) : (
            <span className="text-xs text-slate-500">{stock} in stock</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Listed On',
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>,
  },
  {
    id: 'availability',
    header: 'Visibility',
    enableSorting: false,
    cell: ({ row }) => <AvailabilityToggle productId={row.original.id} initial={row.original.is_available} />,
  },
  {
    id: 'boost',
    header: 'Promotion',
    enableSorting: false,
    cell: ({ row }) => <BoostToggle productId={row.original.id} isFeatured={row.original.is_featured} boostedUntil={row.original.boosted_until} />,
  },
  {
    id: 'approval',
    header: 'Approval',
    enableSorting: false,
    cell: ({ row }) => <ApprovalActions productId={row.original.id} currentStatus={row.original.approval_status} reason={row.original.approval_notes} />
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex gap-3 items-center justify-end">
        <Link href={`/admin/products/${row.original.id}/edit`} className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit Product">
          <Edit2 size={16} />
        </Link>
        <DeleteProductButton
          productId={row.original.id}
          onDelete={adminDeleteProduct}
          className="text-slate-400 hover:text-rose-600 transition-colors p-0 h-auto bg-transparent border-none"
        >
          <Trash2 size={16} />
        </DeleteProductButton>
      </div>
    ),
  },
]

export function ProductDataTable({ rows }: { rows: ProductRow[] }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [approvalFilter, setApprovalFilter] = useState<string>('all')

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    rows.forEach(r => cats.add(r.category))
    return Array.from(cats).sort()
  }, [rows])

  const filteredRows = useMemo(() => {
    let result = rows
    if (categoryFilter !== 'all') {
      result = result.filter(r => r.category === categoryFilter)
    }
    if (approvalFilter !== 'all') {
      result = result.filter(r => r.approval_status === approvalFilter)
    }
    return result
  }, [rows, categoryFilter, approvalFilter])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Filter by Category:</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-alt)',
            color: 'var(--color-text-primary)',
            fontSize: '0.85rem'
          }}
        >
          <option value="all">All Categories</option>
          {uniqueCategories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '1rem' }}>Approval Status:</span>
        <select
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-alt)',
            color: 'var(--color-text-primary)',
            fontSize: '0.85rem'
          }}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <DataTable
        data={filteredRows}
        columns={columns}
        searchPlaceholder="Search product, seller, category…"
      />
    </div>
  )
}
