'use client'

import { useState, useTransition, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Crown, UserX, ShieldBan, ShieldCheck, Eye } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { adminUpdateSubscription, approveVerification, rejectVerification } from '@/lib/actions/admin'
import Link from 'next/link'

interface SellerRow {
  id: string
  full_name: string
  business_name: string
  subscription_plan: string
  subscription_expires_at: string | null
  created_at: string
  verification_status: string
}

import { ConfirmModal } from '@/components/ui/ConfirmModal'

function SellerActions({ sellerId, currentPlan, verificationStatus, canManage }: { sellerId: string; currentPlan: string; verificationStatus: string; canManage: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    action: 'subscription' | 'suspension' | null
  }>({ isOpen: false, action: null })

  const isPro = currentPlan === 'pro'
  const isSuspended = verificationStatus === 'rejected' || verificationStatus === 'unverified'

  const handleConfirm = () => {
    const action = modalConfig.action
    setModalConfig({ ...modalConfig, isOpen: false })
    if (!action) return

    startTransition(async () => {
      try {
        setError(null)
        if (action === 'subscription') {
          await adminUpdateSubscription(sellerId, isPro ? 'free' : 'pro')
        } else if (action === 'suspension') {
          if (isSuspended) {
            await approveVerification(sellerId)
          } else {
            await rejectVerification(sellerId)
          }
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed')
      }
    })
  }

  const subActionName = isPro ? 'Downgrade to Free' : 'Upgrade to Pro'
  const suspActionName = isSuspended ? 'Reactivate' : 'Suspend'

  return (
    <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {canManage && (
      <button
        className={`admin-btn ${isPro ? 'admin-btn-outline' : 'admin-btn-primary'}`}
        disabled={pending}
        onClick={() => setModalConfig({ isOpen: true, action: 'subscription' })}
        title={isPro ? 'Revoke Pro' : 'Grant Pro'}
      >
        {isPro ? <UserX size={14} /> : <Crown size={14} />}
      </button>
      )}

      <button
        className={`admin-btn ${isSuspended ? 'admin-btn-primary' : 'admin-btn-outline'}`}
        disabled={pending}
        onClick={() => setModalConfig({ isOpen: true, action: 'suspension' })}
        title={isSuspended ? 'Reactivate Seller' : 'Suspend Seller'}
        style={{ borderColor: !isSuspended ? 'var(--color-danger)' : undefined, color: !isSuspended ? 'var(--color-danger)' : undefined }}
      >
        {isSuspended ? <ShieldCheck size={14} /> : <ShieldBan size={14} />}
      </button>

      <Link href={`/admin/sellers/${sellerId}`} className="admin-btn admin-btn-outline" title="View Details">
        <Eye size={14} />
      </Link>

      {error && <span style={{ fontSize: '0.68rem', color: 'var(--color-danger)', position: 'absolute', bottom: '-20px', left: 0, whiteSpace: 'nowrap' }}>{error}</span>}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, action: null })}
        onConfirm={handleConfirm}
        title={modalConfig.action === 'subscription' ? subActionName : suspActionName}
        message={`Are you sure you want to ${modalConfig.action === 'subscription' ? subActionName.toLowerCase() : suspActionName.toLowerCase()} this seller?`}
        confirmText={modalConfig.action === 'subscription' ? subActionName : suspActionName}
        variant={
          (modalConfig.action === 'subscription' && isPro) || 
          (modalConfig.action === 'suspension' && !isSuspended) ? 'danger' : 'success'
        }
        isLoading={pending}
      />
    </div>
  )
}

const buildColumns = (canManage: boolean): ColumnDef<SellerRow, any>[] => [
  { 
    accessorKey: 'full_name', 
    header: 'Name', 
    cell: ({ row, getValue }) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Link href={`/admin/sellers/${row.original.id}`} className="td-primary" style={{ textDecoration: 'none' }}>
          {getValue()}
        </Link>
      </div>
    ) 
  },
  { accessorKey: 'business_name', header: 'Business Name' },
  { 
    accessorKey: 'verification_status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue()
      if (status === 'verified') return <span className="admin-badge badge-verified">Active</span>
      if (status === 'rejected') return <span className="admin-badge badge-danger">Suspended</span>
      if (status === 'pending') return <span className="admin-badge badge-warning">Pending</span>
      return <span className="admin-badge badge-default">Unverified</span>
    }
  },
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
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => {
      const plan = row.original.subscription_plan
      const expiresAt = row.original.subscription_expires_at ? new Date(row.original.subscription_expires_at) : null
      const isExpired = expiresAt && expiresAt < new Date()
      const activePlan = isExpired ? 'free' : plan
      
      return (
        <SellerActions 
          sellerId={row.original.id} 
          currentPlan={activePlan} 
          verificationStatus={row.original.verification_status}
          canManage={canManage}
        />
      )
    },
  },
]

export function SellerDataTable({ rows, canManage = true }: { rows: SellerRow[]; canManage?: boolean }) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const columns = useMemo(() => buildColumns(canManage), [canManage])

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows
    if (statusFilter === 'active') return rows.filter(r => r.verification_status === 'verified')
    if (statusFilter === 'suspended') return rows.filter(r => r.verification_status === 'rejected')
    if (statusFilter === 'pending') return rows.filter(r => r.verification_status === 'pending')
    return rows
  }, [rows, statusFilter])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button 
          className={`admin-btn ${statusFilter === 'all' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusFilter('all')}
        >
          All Sellers
        </button>
        <button 
          className={`admin-btn ${statusFilter === 'active' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusFilter('active')}
        >
          Active
        </button>
        <button 
          className={`admin-btn ${statusFilter === 'pending' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`admin-btn ${statusFilter === 'suspended' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusFilter('suspended')}
        >
          Suspended
        </button>
      </div>

      <DataTable
        data={filteredRows}
        columns={columns}
        searchPlaceholder="Search name, business…"
      />
    </div>
  )
}
