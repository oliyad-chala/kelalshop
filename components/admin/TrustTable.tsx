'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Star } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'

interface TrustRow {
  id: string
  name: string
  trustScore: number
  avgRating: number
  totalReviews: number
  verificationStatus: string
  totalOrders: number
}

function VerifBadge({ status }: { status: string }) {
  const cls =
    status === 'verified' ? 'badge-verified' :
    status === 'pending'  ? 'badge-pending'  :
    status === 'rejected' ? 'badge-rejected' :
    'badge-default'
  return <span className={`admin-badge ${cls}`}>{status}</span>
}

function StarRating({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
      <span>{value.toFixed(1)}</span>
    </div>
  )
}

function TrustBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score))
  const color =
    clamped >= 80 ? 'var(--color-success)' :
    clamped >= 50 ? 'var(--color-warning)' :
    'var(--color-danger)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '5px', background: 'var(--color-admin-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${clamped}%`, background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color, fontWeight: 600, width: '2rem', textAlign: 'right' }}>
        {clamped}
      </span>
    </div>
  )
}

const columns: ColumnDef<TrustRow, any>[] = [
  {
    accessorKey: 'name',
    header: 'Shopper',
    cell: ({ getValue }) => (
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{getValue()}</span>
    ),
  },
  {
    accessorKey: 'trustScore',
    header: 'Trust Score',
    cell: ({ getValue }) => <TrustBar score={getValue()} />,
  },
  {
    accessorKey: 'avgRating',
    header: 'Avg Rating',
    cell: ({ getValue }) => <StarRating value={getValue()} />,
  },
  {
    accessorKey: 'totalReviews',
    header: 'Reviews',
    cell: ({ getValue }) => (getValue() as number).toLocaleString(),
  },
  {
    accessorKey: 'totalOrders',
    header: 'Orders',
    cell: ({ getValue }) => (getValue() as number).toLocaleString(),
  },
  {
    accessorKey: 'verificationStatus',
    header: 'Status',
    cell: ({ getValue }) => <VerifBadge status={getValue()} />,
  },
]

export function TrustTable({ rows }: { rows: TrustRow[] }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search shopper name…"
    />
  )
}
