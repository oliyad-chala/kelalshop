'use client'

import { useEffect, useState, useTransition } from 'react'
import { getSellerCampaignProducts, submitCampaignProduct } from '@/lib/actions/campaigns-seller'
import type { SellerProductOption } from '@/lib/actions/campaigns-seller'

type Props = {
  isOpen: boolean
  onClose: () => void
  promotionId: string
  campaignName: string
  minDiscountPct: number | null
  onSuccess: () => void
}

export function CampaignJoinModal({ isOpen, onClose, promotionId, campaignName, minDiscountPct, onSuccess }: Props) {
  const [products, setProducts] = useState<SellerProductOption[]>([])
  const [productId, setProductId] = useState('')
  const [specialPrice, setSpecialPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setProductId('')
    setSpecialPrice('')
    setLoadingProducts(true)
    getSellerCampaignProducts(promotionId)
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingProducts(false))
  }, [isOpen, promotionId])

  const selected = products.find((p) => p.id === productId)
  const discountPct = selected && specialPrice
    ? Math.round((1 - Number(specialPrice) / selected.price) * 100)
    : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await submitCampaignProduct(promotionId, productId, Number(specialPrice))
      if (result.error) {
        setError(result.error)
        return
      }
      onSuccess()
      onClose()
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-navy-900 mb-1">Join Campaign</h2>
        <p className="text-sm text-slate-500 mb-4">{campaignName}</p>

        {minDiscountPct != null && minDiscountPct > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
            Minimum discount required: {minDiscountPct}%
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                const p = products.find((x) => x.id === e.target.value)
                if (p) setSpecialPrice(String(Math.round(p.price * (1 - (minDiscountPct ?? 20) / 100))))
              }}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              disabled={loadingProducts || pending}
            >
              <option value="">{loadingProducts ? 'Loading…' : 'Select a product'}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ETB {p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Price (ETB)</label>
            <input
              type="number"
              min={1}
              step="0.01"
              value={specialPrice}
              onChange={(e) => setSpecialPrice(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              disabled={pending}
            />
            {selected && specialPrice && (
              <p className="text-xs text-emerald-600 mt-1 font-medium">{discountPct}% off regular price</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg" disabled={pending}>
              Cancel
            </button>
            <button type="submit" disabled={pending || !productId || !specialPrice} className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
              {pending ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
