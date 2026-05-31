'use client'

import { useEffect, useState, useTransition } from 'react'
import { getSellerCampaignProducts, submitCampaignProduct } from '@/lib/actions/campaigns-seller'
import type { SellerProductOption } from '@/lib/actions/campaigns-seller'

type Props = {
  isOpen: boolean
  onClose: () => void
  promotionId: string
  campaignName: string
  campaignDescription?: string | null
  minDiscountPct: number | null
  onSuccess: () => void
}

export function CampaignJoinModal({ isOpen, onClose, promotionId, campaignName, campaignDescription, minDiscountPct, onSuccess }: Props) {
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

  const handleProductChange = (id: string) => {
    setProductId(id)
    const p = products.find((x) => x.id === id)
    if (p) {
      const pct = minDiscountPct ?? 20
      const suggested = Math.round(p.price * (1 - pct / 100))
      setSpecialPrice(String(suggested))
    } else {
      setSpecialPrice('')
    }
  }

  const handlePriceChange = (raw: string) => {
    // Allow digits and one decimal point while typing
    const cleaned = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
    setSpecialPrice(cleaned)
  }

  const selected = products.find((p) => p.id === productId)
  const parsedPrice = specialPrice === '' || specialPrice === '.' ? NaN : Number(specialPrice)
  const discountPct =
    selected && Number.isFinite(parsedPrice) && parsedPrice > 0
      ? Math.round((1 - parsedPrice / selected.price) * 100)
      : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const price = Number(specialPrice)
      if (!Number.isFinite(price) || price <= 0) {
        setError('Enter a valid campaign price.')
        return
      }
      const result = await submitCampaignProduct(promotionId, productId, price)
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
        <p className="text-sm text-slate-500 mb-2">{campaignName}</p>
        {campaignDescription && (
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-4 whitespace-pre-line">
            {campaignDescription}
          </p>
        )}

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
              onChange={(e) => handleProductChange(e.target.value)}
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
            {selected && (
              <p className="text-xs text-slate-500 mb-1">
                Regular price: ETB {selected.price.toLocaleString()} — you can edit the sale price below
              </p>
            )}
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 25000"
              value={specialPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              disabled={pending || !productId}
            />
            {selected && Number.isFinite(parsedPrice) && parsedPrice > 0 && (
              <p className={`text-xs mt-1 font-medium ${discountPct >= (minDiscountPct ?? 0) ? 'text-emerald-600' : 'text-amber-600'}`}>
                {discountPct}% off regular price
                {minDiscountPct != null && minDiscountPct > 0 && discountPct < minDiscountPct
                  ? ` (minimum ${minDiscountPct}% required)`
                  : ''}
              </p>
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
