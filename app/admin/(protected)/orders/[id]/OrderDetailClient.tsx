'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adminUpdateOrderStatus } from '@/lib/actions/admin'
import {
  ArrowLeft, Printer, Package, User,
  ShoppingBag, ChevronDown, CheckCircle, AlertCircle, Clock, Truck, XCircle
} from 'lucide-react'

interface OrderDetailClientProps {
  order: any
}

const STATUS_STEPS = ['pending', 'accepted', 'shipped', 'delivered']

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: '#fa8b0c', bg: '#fff4e6', icon: <Clock size={14} /> },
  accepted:  { label: 'Accepted',  color: '#5f63f2', bg: '#eef0ff', icon: <CheckCircle size={14} /> },
  shipped:   { label: 'Shipped',   color: '#a155e8', bg: '#f4ebfc', icon: <Truck size={14} /> },
  delivered: { label: 'Delivered', color: '#20c997', bg: '#e6f8f3', icon: <CheckCircle size={14} /> },
  cancelled: { label: 'Cancelled', color: '#ff4d4f', bg: '#ffebeb', icon: <XCircle size={14} /> },
  disputed:  { label: 'Disputed',  color: '#ff4d4f', bg: '#ffebeb', icon: <AlertCircle size={14} /> },
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-admin-border)' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState<string>(order.status)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending']
  const stepIndex = STATUS_STEPS.indexOf(status)

  const handleStatusChange = (next: string) => {
    setError(null)
    setSaved(false)
    setStatus(next)
    startTransition(async () => {
      try {
        await adminUpdateOrderStatus(order.id, next)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (e: any) {
        setError(e.message ?? 'Failed to update status')
        setStatus(order.status)
      }
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const shortId = order.id.split('-')[0].toUpperCase()
  const shippingRef = `KELAL-${order.id.slice(-6).toUpperCase()}`
  const product = order.products
  const buyer = order.buyer
  const seller = order.shopper

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/admin/orders')}
            className="admin-btn admin-btn-outline"
            style={{ padding: '0.45rem 0.75rem' }}
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="section-title">Order #{shortId}</h1>
            <p className="section-subtitle">
              Placed on {new Date(order.created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-btn admin-btn-outline" onClick={handlePrint}>
            <Printer size={15} /> Print Receipt
          </button>
        </div>
      </div>

      {/* Alerts */}
      {saved && (
        <div className="admin-alert admin-alert-success" style={{ marginBottom: '1rem' }}>
          <CheckCircle size={15} /> Order status updated successfully.
        </div>
      )}
      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Progress Tracker */}
      {!['cancelled', 'disputed'].includes(status) && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {STATUS_STEPS.map((step, i) => {
              const done = stepIndex >= i
              const active = stepIndex === i
              return (
                <div key={step} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: '0 0 auto' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: done ? 'var(--color-accent-500)' : 'var(--color-admin-elevated)',
                      border: active ? '2px solid var(--color-accent-500)' : '2px solid var(--color-admin-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s'
                    }}>
                      {done
                        ? <CheckCircle size={16} color="#fff" />
                        : <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-admin-border)' }} />
                      }
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: active ? 700 : 500, color: done ? 'var(--color-accent-500)' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ flex: 1, height: '2px', background: stepIndex > i ? 'var(--color-accent-500)' : 'var(--color-admin-border)', margin: '0 4px', marginBottom: '20px', transition: 'background 0.3s' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
        {/* Left Column */}
        <div>
          {/* Product */}
          <InfoCard title="Product">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--color-admin-bg)', border: '1px solid var(--color-admin-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                {product?.product_images?.[0]?.url
                  ? <img src={product.product_images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Package size={28} color="var(--color-text-muted)" />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                  {product?.name ?? 'Custom / Assorted Items'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Shipping Ref: <span style={{ color: 'var(--color-info)', fontWeight: 600 }}>{shippingRef}</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  ETB {Number(order.amount).toFixed(2)}
                </div>
              </div>
            </div>
          </InfoCard>

          {/* Buyer */}
          <InfoCard title="Buyer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={18} color="var(--color-info)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{buyer?.full_name ?? '—'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{buyer?.phone ?? 'No Phone'}</div>
              </div>
            </div>
          </InfoCard>

          {/* Seller */}
          <InfoCard title="Seller">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingBag size={18} color="var(--color-success)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{seller?.full_name ?? '—'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{seller?.phone ?? 'No Phone'}</div>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Right Column — Order Summary */}
        <div>
          <InfoCard title="Order Summary">
            <InfoRow label="Order ID" value={`#${shortId}`} />
            <InfoRow label="Shipping Ref" value={<span style={{ color: 'var(--color-info)', fontWeight: 600 }}>{shippingRef}</span>} />
            <InfoRow label="Date Placed" value={new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
            {order.updated_at && (
              <InfoRow label="Last Updated" value={new Date(order.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
            )}
            <InfoRow label="Total Amount" value={<span style={{ fontWeight: 700, fontSize: '1.05rem' }}>ETB {Number(order.amount).toFixed(2)}</span>} />
            <div style={{ paddingTop: '0.5rem' }}>
              <InfoRow label="Status" value={
                <span style={{ background: cfg.bg, color: cfg.color, padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  {cfg.icon} {cfg.label}
                </span>
              } />
            </div>
          </InfoCard>

          {/* Update Status */}
          <InfoCard title="Update Status">
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>
              Change the order status. The change saves immediately.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['pending', 'accepted', 'shipped', 'delivered', 'cancelled', 'disputed'].map(s => (
                <button
                  key={s}
                  disabled={pending || status === s}
                  onClick={() => handleStatusChange(s)}
                  style={{
                    width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid',
                    textAlign: 'left', cursor: status === s ? 'default' : 'pointer',
                    background: status === s ? (STATUS_CONFIG[s]?.bg ?? '#f9fafb') : 'var(--color-admin-surface)',
                    borderColor: status === s ? (STATUS_CONFIG[s]?.color ?? '#d1d5db') : 'var(--color-admin-border)',
                    color: status === s ? (STATUS_CONFIG[s]?.color ?? 'var(--color-text-primary)') : 'var(--color-text-secondary)',
                    fontWeight: status === s ? 700 : 500,
                    fontSize: '0.875rem',
                    opacity: pending ? 0.7 : 1,
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}
                >
                  {status === s && STATUS_CONFIG[s]?.icon}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {status === s && <span style={{ marginLeft: 'auto', fontSize: '0.72rem' }}>Current</span>}
                </button>
              ))}
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  )
}
