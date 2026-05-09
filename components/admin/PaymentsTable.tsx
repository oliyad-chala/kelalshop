'use client'

import { useState, useTransition } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { approvePayment, rejectPayment } from '@/lib/actions/admin'

interface PaymentRow {
  id: string
  shopper: string
  payment_type: string
  reference_number: string
  amount: number
  created_at: string
}

function fmtCurrency(n: number) {
  return `ETB ${Number(n).toFixed(2)}`
}

function PaymentAction({ paymentId }: { paymentId: string }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (done) {
    return <span className="admin-badge badge-verified">Processed ✓</span>
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button
        className="admin-btn admin-btn-success"
        disabled={pending}
        onClick={() => {
          setError(null)
          if (!confirm('Are you sure you want to approve this payment? This will activate their subscription or boost immediately.')) return;
          startTransition(async () => {
            try {
              const res = await approvePayment(paymentId)
              if (res?.error) throw new Error(res.error)
              setDone(true)
            } catch (e: any) {
              setError(e.message ?? 'Failed')
            }
          })
        }}
      >
        <CheckCircle size={14} />
        {pending ? '...' : 'Approve'}
      </button>

      <button
        className="admin-btn admin-btn-danger"
        disabled={pending}
        onClick={() => {
          setError(null)
          if (!confirm('Are you sure you want to reject this payment request?')) return;
          startTransition(async () => {
            try {
              const res = await rejectPayment(paymentId)
              if (res?.error) throw new Error(res.error)
              setDone(true)
            } catch (e: any) {
              setError(e.message ?? 'Failed')
            }
          })
        }}
      >
        <XCircle size={14} />
        Reject
      </button>

      {error && <span style={{ fontSize: '0.68rem', color: 'var(--color-danger)', position: 'absolute', bottom: '-15px' }}>{error}</span>}
    </div>
  )
}

const columns: ColumnDef<PaymentRow, any>[] = [
  {
    accessorKey: 'reference_number',
    header: 'Reference (CBE)',
    cell: ({ getValue }) => (
      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
        {String(getValue())}
      </span>
    ),
  },
  { accessorKey: 'shopper',header: 'Shopper', cell: ({ getValue }) => <span className="td-primary">{getValue()}</span> },
  { 
    accessorKey: 'payment_type',
    header: 'Type',
    cell: ({ getValue }) => {
      const type = String(getValue())
      let label = type
      if (type === 'pro_subscription') label = 'Pro Plan'
      if (type === 'boost_7_days') label = '7-Day Boost'
      if (type === 'boost_28_days') label = '28-Day Boost'
      return <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{label}</span>
    }
  },
  {
    accessorKey: 'amount',
    header: 'Amount Paid',
    cell: ({ getValue }) => <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{fmtCurrency(getValue())}</span>,
  },
  {
    accessorKey: 'created_at',
    header: 'Submitted',
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'action',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => <div style={{ position: 'relative' }}><PaymentAction paymentId={row.original.id} /></div>,
  },
]

export function PaymentsTable({ rows }: { rows: PaymentRow[] }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search reference number or shopper…"
    />
  )
}

export function RevenueCard({ total }: { total: number }) {
  return (
    <div className="admin-card" style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
      borderColor: 'rgba(99,102,241,0.3)',
    }}>
      <div style={{
        width: '3rem', height: '3rem', borderRadius: '10px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <DollarSign size={18} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
          Total Platform Subscription Revenue
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
          {total >= 1000 ? `ETB ${(total / 1000).toFixed(1)}k` : `ETB ${total.toFixed(2)}`}
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <CheckCircle size={12} /> Approved Payments
      </div>
    </div>
  )
}

