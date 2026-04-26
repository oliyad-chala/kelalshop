'use client'

import { useState, useTransition } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DollarSign, Send, AlertCircle } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { releasePayout } from '@/lib/actions/admin'

interface PayoutRow {
  id: string
  buyer: string
  shopper: string
  amount: number
  commission_rate: number
  created_at: string
}

function fmtCurrency(n: number) {
  return `ETB ${Number(n).toFixed(2)}`
}

function PayoutAction({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (done) {
    return <span className="admin-badge badge-verified">Released ✓</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <button
        className="admin-btn admin-btn-success"
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            try {
              await releasePayout(orderId)
              setDone(true)
            } catch (e: any) {
              setError(e.message ?? 'Failed')
            }
          })
        }}
      >
        <Send size={12} />
        {pending ? 'Releasing…' : 'Release'}
      </button>
      {error && <span style={{ fontSize: '0.68rem', color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  )
}

const columns: ColumnDef<PayoutRow, any>[] = [
  {
    accessorKey: 'id',
    header: 'Order ID',
    cell: ({ getValue }) => (
      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        {String(getValue()).slice(0, 8)}…
      </span>
    ),
  },
  { accessorKey: 'buyer',  header: 'Buyer',   cell: ({ getValue }) => <span className="td-primary">{getValue()}</span> },
  { accessorKey: 'shopper',header: 'Shopper', cell: ({ getValue }) => <span>{getValue()}</span> },
  {
    accessorKey: 'amount',
    header: 'Order Amount',
    cell: ({ getValue }) => fmtCurrency(getValue()),
  },
  {
    id: 'payout',
    header: 'Payout (net)',
    cell: ({ row }) => {
      const net = row.original.amount * (1 - (row.original.commission_rate ?? 0.05))
      return <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{fmtCurrency(net)}</span>
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Delivered At',
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  },
  {
    id: 'action',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => <PayoutAction orderId={row.original.id} />,
  },
]

export function PayoutsTable({ rows }: { rows: PayoutRow[] }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search buyer, shopper…"
    />
  )
}

export function TotalWalletCard({ total }: { total: number }) {
  return (
    <div className="admin-card" style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
      borderColor: 'rgba(99,102,241,0.3)',
    }}>
      <div style={{
        width: '3rem', height: '3rem', borderRadius: '10px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <DollarSign size={18} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
          Total Shopper Wallet Balances
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
          {total >= 1000 ? `ETB ${(total / 1000).toFixed(1)}k` : `ETB ${total.toFixed(2)}`}
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <AlertCircle size={12} /> Escrow-held funds
      </div>
    </div>
  )
}
