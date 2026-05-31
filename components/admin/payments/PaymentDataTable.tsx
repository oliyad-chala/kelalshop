'use client'

import { useState, useTransition, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DollarSign, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { approvePayment, rejectPayment } from '@/lib/actions/admin'

interface PaymentRow {
  id: string
  shopper: string
  payment_type: string
  receipt_url: string
  amount: number
  status: string
  created_at: string
}

function fmtCurrency(n: number) {
  return `ETB ${Number(n).toFixed(2)}`
}

function PaymentAction({ paymentId, status }: { paymentId: string, status: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (status !== 'pending') {
    return (
      <span className={`admin-badge ${status === 'approved' ? 'badge-verified' : 'badge-danger'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
      <button
        className="admin-btn admin-btn-success"
        disabled={pending}
        onClick={() => {
          setError(null)
          if (!confirm('Are you sure you want to approve this payment?')) return;
          startTransition(async () => {
            try {
              const res = await approvePayment(paymentId)
              if (res?.error) throw new Error(res.error)
            } catch (e: any) {
              setError(e.message ?? 'Failed')
            }
          })
        }}
        title="Approve Payment"
      >
        <CheckCircle size={14} />
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
            } catch (e: any) {
              setError(e.message ?? 'Failed')
            }
          })
        }}
        title="Reject Payment"
      >
        <XCircle size={14} />
      </button>

      {error && <span style={{ fontSize: '0.68rem', color: 'var(--color-danger)', position: 'absolute', bottom: '-15px', whiteSpace: 'nowrap' }}>{error}</span>}
    </div>
  )
}

const columns: ColumnDef<PaymentRow, any>[] = [
  {
    accessorKey: 'receipt_url',
    header: 'Receipt',
    cell: ({ getValue }) => {
      const url = String(getValue())
      if (!url || url === 'undefined' || url === 'null') {
         return <span className="text-slate-400 italic text-xs">No receipt</span>
      }
      return (
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors group">
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden relative">
            <img src={url} alt="Receipt Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xs font-semibold">View</span>
        </a>
      )
    },
  },
  { accessorKey: 'shopper', header: 'Seller', cell: ({ getValue }) => <span className="td-primary">{getValue()}</span> },
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
    header: 'Date',
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  },
  {
    id: 'action',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => <PaymentAction paymentId={row.original.id} status={row.original.status} />,
  },
]

export function PaymentDataTable({ rows }: { rows: PaymentRow[] }) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows
    return rows.filter(r => r.status === statusFilter)
  }, [rows, statusFilter])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
        <button 
          className={`admin-btn ${statusFilter === 'all' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusFilter('all')}
        >
          All Transactions
        </button>
        <button 
          className={`admin-btn ${statusFilter === 'pending' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`admin-btn ${statusFilter === 'approved' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusFilter('approved')}
        >
          Approved
        </button>
        <button 
          className={`admin-btn ${statusFilter === 'rejected' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusFilter('rejected')}
        >
          Rejected
        </button>
      </div>

      <DataTable
        data={filteredRows}
        columns={columns}
        searchPlaceholder="Search seller..."
      />
    </div>
  )
}

export function RevenueCard({ total, pendingCount }: { total: number, pendingCount: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
      <div className="admin-card" style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.02))',
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
            Total Verified Revenue
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
            {total >= 1000 ? `ETB ${(total / 1000).toFixed(1)}k` : `ETB ${total.toFixed(2)}`}
          </div>
        </div>
      </div>

      <div className="admin-card" style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div style={{
          width: '3rem', height: '3rem', borderRadius: '10px',
          background: 'var(--color-bg-alt)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Clock size={18} color="var(--color-warning)" />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
            Pending Manual Reviews
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
            {pendingCount}
          </div>
        </div>
      </div>
    </div>
  )
}
