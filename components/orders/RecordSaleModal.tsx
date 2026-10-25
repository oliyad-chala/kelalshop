'use client'

import { useState } from 'react'
import { X, PlusCircle, Check, Loader2, Phone, Send, Users, DollarSign } from 'lucide-react'
import { recordDirectSale } from '@/lib/actions/orders'
import { formatPrice } from '@/lib/utils/formatters'

interface ProductOption {
  id: string
  name: string
  price: number
  is_available: boolean
}

interface RecordSaleModalProps {
  isOpen: boolean
  onClose: () => void
  products: ProductOption[]
  onSuccess?: () => void
}

export function RecordSaleModal({ isOpen, onClose, products, onSuccess }: RecordSaleModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [customName, setCustomName] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [channel, setChannel] = useState<'phone' | 'telegram' | 'in_person' | 'other'>('phone')
  const [markAsSold, setMarkAsSold] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId)
    if (prodId === 'custom' || !prodId) {
      // keep or clear
    } else {
      const found = products.find(p => p.id === prodId)
      if (found) {
        setAmount(String(found.price))
        setCustomName(found.name)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid price in ETB.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await recordDirectSale({
        productId: selectedProductId === 'custom' || !selectedProductId ? null : selectedProductId,
        productName: selectedProductId === 'custom' ? customName : undefined,
        amount: numAmount,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        channel,
        markAsSold: Boolean(markAsSold && selectedProductId && selectedProductId !== 'custom'),
      })

      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          onClose()
          if (onSuccess) onSuccess()
        }, 1200)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to record direct sale.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-950">Record a Direct Sale</h3>
              <p className="text-xs text-slate-500">Log an offline purchase from a Phone or Telegram customer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-navy-950">Sale Successfully Recorded!</h4>
            <p className="text-xs text-slate-500">Your revenue has been updated and the product marked as sold.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Select Product */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Sold Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-slate-50 focus:bg-white"
                required
              >
                <option value="">-- Choose from your listings --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatPrice(p.price)}) {p.is_available ? '' : '• Already Sold'}
                  </option>
                ))}
                <option value="custom">+ Unlisted / Custom Item</option>
              </select>
            </div>

            {/* Custom Product Name if selected */}
            {selectedProductId === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Item Description / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. SHEIN Floral Dress"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-slate-50 focus:bg-white"
                  required
                />
              </div>
            )}

            {/* Price & Channel Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Sale Price (ETB)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-amber-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Sale Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-slate-50 focus:bg-white"
                >
                  <option value="phone">📞 Phone Call</option>
                  <option value="telegram">✈️ Telegram</option>
                  <option value="in_person">🤝 In Person</option>
                  <option value="other">💬 Other Direct</option>
                </select>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Customer Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Liya Behailu"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Customer Phone <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0911223344"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Mark as sold toggle */}
            {selectedProductId && selectedProductId !== 'custom' && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={markAsSold}
                  onChange={(e) => setMarkAsSold(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span className="text-xs text-navy-900 font-medium">
                  Automatically mark this item as <strong>Sold</strong> on your store
                </span>
              </label>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                <span>Record Sale & Update Revenue</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
