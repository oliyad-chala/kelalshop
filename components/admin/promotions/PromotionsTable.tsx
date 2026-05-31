'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { deleteCampaign, updateCampaignStatus } from '@/lib/actions/campaigns'

export type PromotionRow = {
  id: string
  name: string
  type: string
  status: string
  start_date: string
  end_date: string
  target_country: string | null
  target_region: string | null
  approvedCount: number
  pendingCount: number
}

const TYPE_LABELS: Record<string, string> = {
  flash_sale_campaign: 'Flash Sale',
  banner: 'Banner',
  shipping: 'Shipping',
}

const STATUS_CLASS: Record<string, string> = {
  active: 'badge-verified',
  upcoming: 'badge-pending',
  ended: 'badge-default',
}

function StatusActions({ row, canManage }: { row: PromotionRow; canManage: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!canManage) {
    return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>View only</span>
  }

  const runStatus = (status: 'upcoming' | 'active' | 'ended') => {
    startTransition(async () => {
      await updateCampaignStatus(row.id, status)
      router.refresh()
    })
  }

  const runDelete = () => {
    startTransition(async () => {
      await deleteCampaign(row.id)
      setDeleteOpen(false)
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Link href={`/admin/promotions/${row.id}`} className="admin-btn admin-btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
        Manage
      </Link>
      <Link href={`/admin/promotions/${row.id}/edit`} className="admin-btn admin-btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
        Edit
      </Link>
      {row.status === 'upcoming' && (
        <button type="button" className="admin-btn admin-btn-success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} disabled={pending} onClick={() => runStatus('active')}>
          Activate
        </button>
      )}
      {row.status === 'active' && (
        <button type="button" className="admin-btn admin-btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} disabled={pending} onClick={() => runStatus('ended')}>
          End
        </button>
      )}
      <button type="button" className="admin-btn admin-btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} disabled={pending} onClick={() => setDeleteOpen(true)}>
        Delete
      </button>
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={runDelete}
        title="Delete Campaign"
        message={`Delete "${row.name}"? This removes all product submissions too.`}
        confirmText="Delete"
        variant="danger"
        isLoading={pending}
      />
    </div>
  )
}

const buildColumns = (canManage: boolean): ColumnDef<PromotionRow, any>[] => [
  {
    accessorKey: 'name',
    header: 'Campaign',
    cell: ({ row }) => (
      <div>
        <div className="td-primary">{row.original.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {TYPE_LABELS[row.original.type] ?? row.original.type}
        </div>
      </div>
    ),
  },
  {
    id: 'schedule',
    header: 'Schedule',
    cell: ({ row }) => (
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
        <div>{new Date(row.original.start_date).toLocaleDateString()}</div>
        <div>→ {new Date(row.original.end_date).toLocaleDateString()}</div>
      </div>
    ),
  },
  {
    id: 'target',
    header: 'Target',
    cell: ({ row }) => (
      <span style={{ fontSize: '0.8rem' }}>
        {row.original.target_country
          ? `${row.original.target_country}${row.original.target_region ? ` / ${row.original.target_region}` : ''}`
          : 'Global'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => (
      <span className={`admin-badge ${STATUS_CLASS[String(getValue())] ?? 'badge-default'}`}>
        {String(getValue())}
      </span>
    ),
  },
  {
    id: 'products',
    header: 'Products',
    cell: ({ row }) => (
      <span style={{ fontSize: '0.8rem' }}>
        {row.original.approvedCount} approved · {row.original.pendingCount} pending
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => <StatusActions row={row.original} canManage={canManage} />,
  },
]

export function PromotionsTable({ rows, canManage = true }: { rows: PromotionRow[]; canManage?: boolean }) {
  const columns = useMemo(() => buildColumns(canManage), [canManage])

  return (
    <DataTable data={rows} columns={columns} searchPlaceholder="Search campaigns…" />
  )
}
