'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveSubmission, rejectSubmission, adminForceAddProduct, removeProductFromCampaign, updateCampaignStatus } from '@/lib/actions/campaigns'

interface Submission {
  promotion_id: string
  product_id: string
  shopper_id: string
  special_price: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  products: { id: string; name: string; price: number; stock: number; location: string | null; product_images: { url: string; is_primary: boolean }[] } | null
  profiles: { full_name: string; email: string } | null
}

interface AvailableProduct {
  id: string
  name: string
  price: number
  shopper_id: string
  profiles: { full_name: string } | null
}

interface Props {
  campaignId: string
  campaignStatus: 'upcoming' | 'active' | 'ended'
  submissions: Submission[]
  availableToAdd: AvailableProduct[]
}

type Tab = 'pending' | 'approved' | 'rejected' | 'all'

export function CampaignDetailClient({ campaignId, campaignStatus, submissions, availableToAdd }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [showForceAdd, setShowForceAdd] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [specialPrice, setSpecialPrice] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [forceMessage, setForceMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const pendingCount = submissions.filter((s) => s.status === 'pending').length

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'pending',  label: '⏳ Pending',  count: pendingCount },
    { id: 'approved', label: '✅ Approved', count: submissions.filter(s => s.status === 'approved').length },
    { id: 'rejected', label: '❌ Rejected', count: submissions.filter(s => s.status === 'rejected').length },
    { id: 'all',      label: '📋 All',      count: submissions.length },
  ]

  const filtered = submissions.filter(s => {
    const matchTab = activeTab === 'all' || s.status === activeTab
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || s.products?.name?.toLowerCase().includes(q) || s.profiles?.full_name?.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const refresh = () => router.refresh()

  const handleApprove = (productId: string) => {
    startTransition(async () => {
      await approveSubmission(campaignId, productId)
      refresh()
    })
  }

  const handleReject = (productId: string) => {
    if (!rejectReason.trim()) return
    startTransition(async () => {
      await rejectSubmission(campaignId, productId, rejectReason)
      setRejectingId(null)
      setRejectReason('')
      refresh()
    })
  }

  const handleRemove = (productId: string) => {
    startTransition(async () => {
      await removeProductFromCampaign(campaignId, productId)
      refresh()
    })
  }

  const handleForceAdd = async () => {
    if (!selectedProductId || !specialPrice) {
      setForceMessage('Please select a product and set a special price.')
      return
    }
    const result = await adminForceAddProduct(campaignId, selectedProductId, Number(specialPrice))
    if (result?.error) setForceMessage(result.error)
    else {
      setForceMessage('Product added successfully!')
      setSelectedProductId('')
      setSpecialPrice('')
      refresh()
    }
  }

  const handleStatusChange = (status: 'upcoming' | 'active' | 'ended') => {
    startTransition(async () => {
      await updateCampaignStatus(campaignId, status)
      refresh()
    })
  }

  const selectedProduct = availableToAdd.find(p => p.id === selectedProductId)

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>

      {/* Status controls */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        {campaignStatus === 'upcoming' && (
          <button type="button" className="admin-btn admin-btn-success" disabled={isPending} onClick={() => handleStatusChange('active')}>
            Activate Campaign
          </button>
        )}
        {campaignStatus === 'active' && (
          <button type="button" className="admin-btn admin-btn-danger" disabled={isPending} onClick={() => handleStatusChange('ended')}>
            End Campaign
          </button>
        )}
      </div>

      {/* Force-Add Panel Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', margin: 0 }}>Seller Submissions</h2>
        <button
          onClick={() => setShowForceAdd(v => !v)}
          style={{
            background: showForceAdd ? '#fee2e2' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: showForceAdd ? '#b91c1c' : '#fff',
            border: 'none', borderRadius: '9px', padding: '0.6rem 1.2rem',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            boxShadow: showForceAdd ? 'none' : '0 4px 10px rgba(99,102,241,0.3)',
          }}
        >
          {showForceAdd ? '✕ Cancel' : '⚡ Force-Add Product'}
        </button>
      </div>

      {/* Force-Add Form */}
      {showForceAdd && (
        <div style={{ background: 'linear-gradient(135deg, #f0f4ff, #e8ecff)', border: '1px solid #c7d2fe', borderRadius: '14px', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: '#3730a3', marginBottom: '1rem', fontSize: '0.95rem' }}>
            ⚡ Admin Force-Add a Product
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#4338ca', marginBottom: '1.25rem' }}>
            Add any approved product directly to this campaign — the seller will be notified and the product will be auto-approved.
          </p>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Search & Select Product</label>
              <select
                value={selectedProductId}
                onChange={e => {
                  setSelectedProductId(e.target.value)
                  const p = availableToAdd.find(p => p.id === e.target.value)
                  if (p) setSpecialPrice(String(Math.round(p.price * 0.8)))
                }}
                style={inputStyle}
              >
                <option value="">— Choose a product —</option>
                {availableToAdd.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ETB {p.price} ({(p.profiles as any)?.full_name || 'Unknown Seller'})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div style={{ background: '#fff', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid #c7d2fe', fontSize: '0.83rem', color: '#374151' }}>
                <strong>{selectedProduct.name}</strong>
                <span style={{ marginLeft: '1rem', color: '#6b7280' }}>Original price: ETB {selectedProduct.price}</span>
                <span style={{ marginLeft: '1rem', color: '#6b7280' }}>by {(selectedProduct.profiles as any)?.full_name}</span>
              </div>
            )}

            <div>
              <label style={labelStyle}>Campaign Special Price (ETB)</label>
              <input
                type="number"
                min={0}
                value={specialPrice}
                onChange={e => setSpecialPrice(e.target.value)}
                placeholder="e.g. 450"
                style={{ ...inputStyle, width: '220px' }}
              />
              {selectedProduct && specialPrice && (
                <span style={{ fontSize: '0.78rem', color: '#10b981', marginLeft: '0.75rem', fontWeight: 600 }}>
                  = {Math.round((1 - Number(specialPrice) / selectedProduct.price) * 100)}% off
                </span>
              )}
            </div>

            {forceMessage && (
              <div style={{
                padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600,
                background: forceMessage.startsWith('✅') ? '#d1fae5' : '#fee2e2',
                color: forceMessage.startsWith('✅') ? '#065f46' : '#b91c1c',
              }}>
                {forceMessage}
              </div>
            )}

            <div>
              <button
                onClick={handleForceAdd}
                disabled={isPending || !selectedProductId || !specialPrice}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
                  border: 'none', borderRadius: '9px', padding: '0.65rem 1.5rem',
                  fontWeight: 700, fontSize: '0.875rem', cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? 'Adding…' : '⚡ Add to Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #f3f4f6', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1rem', fontWeight: 600, fontSize: '0.83rem',
              border: 'none', background: 'none', cursor: 'pointer',
              color: activeTab === tab.id ? '#4f46e5' : '#6b7280',
              borderBottom: activeTab === tab.id ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id ? '#e0e7ff' : '#f3f4f6',
                color: activeTab === tab.id ? '#4f46e5' : '#6b7280',
                borderRadius: '12px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', paddingBottom: '0.4rem' }}>
          <input
            type="search"
            placeholder="Search products or sellers…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.8rem', color: '#374151', outline: 'none', width: '220px' }}
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            <div style={{ fontWeight: 600, color: '#374151' }}>No {activeTab !== 'all' ? activeTab : ''} submissions</div>
            {activeTab === 'pending' && (
              <div style={{ fontSize: '0.83rem', marginTop: '0.25rem' }}>
                {submissions.length > 0 && pendingCount === 0
                  ? 'No pending items — check Approved or All tabs.'
                  : "When sellers submit products, they'll appear here for your review."}
              </div>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {['Product', 'Seller', 'Original Price', 'Campaign Price', 'Discount', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.8rem 1.1rem', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, i) => {
                const img = sub.products?.product_images?.find(i => i.is_primary)?.url || sub.products?.product_images?.[0]?.url
                const discountPct = sub.products?.price ? Math.round((1 - sub.special_price / sub.products.price) * 100) : 0
                return (
                  <tr key={`${sub.promotion_id}-${sub.product_id}`} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined }}>
                    <td style={{ padding: '0.85rem 1.1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {img && <img src={img} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{sub.products?.name || '—'}</div>
                          {sub.products?.location && <div style={{ fontSize: '0.73rem', color: '#9ca3af' }}>📍 {sub.products.location}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', color: '#374151', fontSize: '0.83rem' }}>
                      <div style={{ fontWeight: 600 }}>{sub.profiles?.full_name || '—'}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{sub.profiles?.email}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', color: '#6b7280', textDecoration: 'line-through' }}>
                      ETB {sub.products?.price?.toLocaleString() || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', color: '#0f172a', fontWeight: 700 }}>
                      ETB {sub.special_price.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem' }}>
                      <span style={{
                        background: discountPct >= 30 ? '#d1fae5' : discountPct >= 15 ? '#fef3c7' : '#fee2e2',
                        color: discountPct >= 30 ? '#065f46' : discountPct >= 15 ? '#92400e' : '#b91c1c',
                        padding: '3px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        {discountPct}% OFF
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700,
                        background: sub.status === 'approved' ? '#d1fae5' : sub.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: sub.status === 'approved' ? '#065f46' : sub.status === 'pending' ? '#92400e' : '#b91c1c',
                      }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {sub.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(sub.product_id)}
                              disabled={isPending}
                              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                            {rejectingId === sub.product_id ? (
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <input
                                  value={rejectReason}
                                  onChange={e => setRejectReason(e.target.value)}
                                  placeholder="Reason…"
                                  style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '3px 8px', fontSize: '0.78rem', width: '140px' }}
                                />
                                <button onClick={() => handleReject(sub.product_id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Send</button>
                                <button onClick={() => setRejectingId(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', cursor: 'pointer' }}>✕</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRejectingId(sub.product_id)}
                                style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => handleRemove(sub.product_id)}
                          disabled={isPending}
                          style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
                          title="Remove from campaign"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px',
  border: '1px solid #c7d2fe', fontSize: '0.875rem', color: '#0f172a',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
}
