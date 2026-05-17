'use client'

import { useState, useTransition, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { ToggleLeft, ToggleRight, Eye } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { toggleProductAvailability, adminToggleProductBoost } from '@/lib/actions/admin'
import Link from 'next/link'

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
        ? <ToggleRight size={18} style={{ flexShrink: 0 }} />
        : <ToggleLeft  size={18} style={{ flexShrink: 0 }} />}
      {enabled ? 'Active' : 'Removed'}
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
        ? <ToggleRight size={18} style={{ flexShrink: 0, color: '#f59e0b' }} />
        : <ToggleLeft  size={18} style={{ flexShrink: 0 }} />}
      {enabled ? 'Featured' : 'Standard'}
    </button>
  )
}

const columns: ColumnDef<ProductRow, any>[] = [
  {
    accessorKey: 'name',
    header: 'Product',
    cell: ({ row, getValue }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{getValue()}</span>
        <Link href={`/products/${row.original.id}`} target="_blank" style={{ color: 'var(--color-text-muted)', display: 'flex' }} title="View on marketplace">
          <Eye size={14} />
        </Link>
      </div>
    ),
  },
  { accessorKey: 'shopperName', header: 'Seller' },
  { accessorKey: 'category',    header: 'Category' },
  {
    accessorKey: 'price',
    header: 'Price (ETB)',
    cell: ({ getValue }) => `ETB ${Number(getValue()).toFixed(2)}`,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ getValue }) => {
      const val = Number(getValue())
      if (val === 0) return <span className="admin-badge badge-danger">Out of Stock</span>
      return <span style={{ color: 'var(--color-text-secondary)' }}>{val}</span>
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Listed On',
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  },
  {
    id: 'availability',
    header: 'Status (Spam Control)',
    enableSorting: false,
    cell: ({ row }) => <AvailabilityToggle productId={row.original.id} initial={row.original.is_available} />,
  },
  {
    id: 'boost',
    header: 'Promotion',
    enableSorting: false,
    cell: ({ row }) => <BoostToggle productId={row.original.id} isFeatured={row.original.is_featured} boostedUntil={row.original.boosted_until} />,
  },
]

export function ProductDataTable({ rows }: { rows: ProductRow[] }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    rows.forEach(r => cats.add(r.category))
    return Array.from(cats).sort()
  }, [rows])

  const filteredRows = useMemo(() => {
    if (categoryFilter === 'all') return rows
    return rows.filter(r => r.category === categoryFilter)
  }, [rows, categoryFilter])

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
      </div>

      <DataTable
        data={filteredRows}
        columns={columns}
        searchPlaceholder="Search product, seller, category…"
      />
    </div>
  )
}
