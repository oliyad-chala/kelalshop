'use client'

import { useState, useTransition } from 'react'
import { createFlashDeal, deleteFlashDeal, toggleFlashDeal } from '@/lib/actions/flash-deals'
import { formatPrice, formatDate } from '@/lib/utils/formatters'

interface Product { id: string; name: string; price: number }
interface Deal {
  id: string
  discount_percent: number
  ends_at: string
  is_active: boolean
  products: Product
}

function CreateDealForm({ products, activeCount }: { products: Product[]; activeCount: number }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [discount, setDiscount] = useState(20)

  const atLimit = activeCount >= 3

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (atLimit) return
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createFlashDeal(formData)
        setSuccess(true)
        ;(e.target as HTMLFormElement).reset()
        setDiscount(20)
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl">⚡</div>
        <div>
          <h2 className="font-bold text-navy-900">Create Flash Deal</h2>
          <p className="text-xs text-slate-500">Max 3 active deals at a time · 5%–90% off</p>
        </div>
        <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${activeCount >= 3 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {activeCount}/3 active
        </span>
      </div>

      {atLimit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
          ⚠️ You have reached the limit of 3 active flash deals. Deactivate or delete one to add a new deal.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium">
          ✓ Flash deal created successfully!
        </div>
      )}

      {/* Product select */}
      <div>
        <label className="block text-sm font-semibold text-navy-900 mb-1.5">Product</label>
        <select
          name="product_id"
          required
          disabled={atLimit}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 bg-white focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none disabled:opacity-50"
        >
          <option value="">Select a product…</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price)}</option>
          ))}
        </select>
      </div>

      {/* Discount slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-navy-900">Discount</label>
          <span className="text-2xl font-extrabold text-red-500">{discount}% OFF</span>
        </div>
        <input
          type="range"
          name="discount_percent"
          min={5}
          max={90}
          value={discount}
          onChange={e => setDiscount(Number(e.target.value))}
          disabled={atLimit}
          className="w-full accent-amber-500 disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>5%</span><span>90%</span>
        </div>
      </div>

      {/* End date/time */}
      <div>
        <label className="block text-sm font-semibold text-navy-900 mb-1.5">Deal Ends At</label>
        <input
          type="datetime-local"
          name="ends_at"
          required
          disabled={atLimit}
          min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 bg-white focus:ring-2 focus:ring-amber-300 outline-none disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || atLimit}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-bold rounded-xl transition-colors text-sm"
      >
        {isPending ? 'Creating…' : '⚡ Launch Flash Deal'}
      </button>
    </form>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const expired = new Date(deal.ends_at) <= new Date()

  const handleToggle = () => {
    setError(null)
    startTransition(async () => {
      try { await toggleFlashDeal(deal.id, deal.is_active) }
      catch (e: any) { setError(e.message) }
    })
  }

  const handleDelete = () => {
    if (!confirm('Delete this flash deal?')) return
    startTransition(async () => {
      try { await deleteFlashDeal(deal.id) }
      catch (e: any) { setError(e.message) }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 font-extrabold text-sm shrink-0">
          -{deal.discount_percent}%
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-900 text-sm truncate">{deal.products?.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Ends {formatDate(deal.ends_at)}
          </p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
          expired ? 'bg-slate-100 text-slate-500' :
          deal.is_active ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-slate-100 text-slate-500'
        }`}>
          {expired ? 'Expired' : deal.is_active ? 'Live' : 'Paused'}
        </span>
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <div className="flex gap-2 pt-1">
        {!expired && (
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
              deal.is_active
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            }`}
          >
            {deal.is_active ? '⏸ Pause' : '▶ Activate'}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  )
}

interface Props {
  products: Product[]
  deals: Deal[]
  activeCount: number
}

export function FlashDealsManager({ products, deals, activeCount }: Props) {
  return (
    <div className="space-y-8">
      <CreateDealForm products={products} activeCount={activeCount} />

      <div>
        <h2 className="font-bold text-navy-900 mb-4">Your Flash Deals ({deals.length})</h2>
        {deals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400 text-sm">
            No flash deals yet. Create your first one above!
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
          </div>
        )}
      </div>
    </div>
  )
}
