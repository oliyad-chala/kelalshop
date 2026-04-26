'use client'

import { useState, useTransition } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { ToggleLeft, ToggleRight } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { toggleProductAvailability } from '@/lib/actions/admin'

interface ProductRow {
  id: string
  name: string
  shopperName: string
  price: number
  stock: number
  category: string
  is_available: boolean
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
        color: enabled ? 'var(--color-success)' : 'var(--color-text-muted)',
        fontSize: '0.78rem', fontWeight: 500,
        padding: '0.25rem 0',
        opacity: pending ? 0.6 : 1,
        transition: 'color 0.15s',
      }}
    >
      {enabled
        ? <ToggleRight size={18} style={{ flexShrink: 0 }} />
        : <ToggleLeft  size={18} style={{ flexShrink: 0 }} />}
      {enabled ? 'Available' : 'Hidden'}
    </button>
  )
}

const columns: ColumnDef<ProductRow, any>[] = [
  {
    accessorKey: 'name',
    header: 'Product',
    cell: ({ getValue }) => (
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{getValue()}</span>
    ),
  },
  { accessorKey: 'shopperName', header: 'Shopper' },
  { accessorKey: 'category',    header: 'Category' },
  {
    accessorKey: 'price',
    header: 'Price (ETB)',
    cell: ({ getValue }) => `ETB ${Number(getValue()).toFixed(2)}`,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ getValue }) => (
      <span style={{ color: Number(getValue()) === 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Listed',
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
  },
  {
    id: 'availability',
    header: 'Availability',
    enableSorting: false,
    cell: ({ row }) => <AvailabilityToggle productId={row.original.id} initial={row.original.is_available} />,
  },
]

export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search product, shopper, category…"
    />
  )
}
