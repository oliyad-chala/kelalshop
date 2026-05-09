'use client'

import { useState, useTransition } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Crown, UserX, UserCheck } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { adminUpdateSubscription } from '@/lib/actions/admin'

interface SellerRow {
  id: string
  full_name: string
  business_name: string
  subscription_plan: string
  subscription_expires_at: string | null
  created_at: string
}

function SubscriptionAction({ sellerId, currentPlan }: { sellerId: string; currentPlan: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isPro = currentPlan === 'pro'

  const toggleSubscription = () => {
    setError(null)
    const action = isPro ? 'Downgrade to Free' : 'Upgrade to Pro'
    if (!confirm(`Are you sure you want to ${action} this seller manually?`)) return;

    startTransition(async () => {
      try {
        const res = await adminUpdateSubscription(sellerId, isPro ? 'free' : 'pro')
        if (res?.error) throw new Error(res.error)
      } catch (e: any) {
        setError(e.message ?? 'Failed')
      }
    })
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className={`admin-btn ${isPro ? 'admin-btn-outline' : 'admin-btn-primary'}`}
        disabled={pending}
        onClick={toggleSubscription}
      >
        {isPro ? <UserX size={14} /> : <Crown size={14} />}
        {pending ? '...' : isPro ? 'Revoke Pro' : 'Grant Pro'}
      </button>
      {error && <span style={{ fontSize: '0.68rem', color: 'var(--color-danger)', position: 'absolute', bottom: '-15px', left: 0 }}>{error}</span>}
    </div>
  )
}

const columns: ColumnDef<SellerRow, any>[] = [
  { accessorKey: 'full_name', header: 'Name', cell: ({ getValue }) => <span className="td-primary">{getValue()}</span> },
  { accessorKey: 'business_name', header: 'Business Name' },
  { 
    accessorKey: 'subscription_plan',
    header: 'Plan',
    cell: ({ row }) => {
      const plan = row.original.subscription_plan
      const expiresAt = row.original.subscription_expires_at ? new Date(row.original.subscription_expires_at) : null
      const isExpired = expiresAt && expiresAt < new Date()
      const activePlan = isExpired ? 'free' : plan

      if (activePlan === 'pro') {
        return <span className="admin-badge badge-verified">Pro</span>
      }
      return <span className="admin-badge badge-default">Free</span>
    }
  },
  {
    accessorKey: 'subscription_expires_at',
    header: 'Expires',
    cell: ({ getValue }) => {
      const val = getValue()
      if (!val) return '—'
      const date = new Date(val)
      const isExpired = date < new Date()
      return (
        <span style={{ color: isExpired ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {isExpired && ' (Expired)'}
        </span>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Joined',
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  },
  {
    id: 'action',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => {
      const plan = row.original.subscription_plan
      const expiresAt = row.original.subscription_expires_at ? new Date(row.original.subscription_expires_at) : null
      const isExpired = expiresAt && expiresAt < new Date()
      const activePlan = isExpired ? 'free' : plan
      
      return <SubscriptionAction sellerId={row.original.id} currentPlan={activePlan} />
    },
  },
]

export function SellersTable({ rows }: { rows: SellerRow[] }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search name, business…"
    />
  )
}
