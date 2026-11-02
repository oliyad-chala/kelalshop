'use client'

import { useState } from 'react'
import { X, PlusCircle, Check, Loader2, Phone, Send, Users, DollarSign, Copy, ExternalLink, Sparkles, Search } from 'lucide-react'
import { recordDirectSale } from '@/lib/actions/orders'
import { formatPrice } from '@/lib/utils/formatters'

interface ProductOption {
  id: string
  name: string
  price: number
  is_available: boolean
  image?: string | null
}

interface RecordSaleModalProps {
  isOpen: boolean
  onClose: () => void
  products: ProductOption[]
  shopperId?: string
  shopperName?: string
  onSuccess?: () => void
}

export function RecordSaleModal({
  isOpen,
  onClose,
  products = [],
  shopperId,
  shopperName,
  onSuccess,
}: RecordSaleModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [customName, setCustomName] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [channel, setChannel] = useState<'phone' | 'telegram' | 'in_person' | 'other'>('phone')
  const [markAsSold, setMarkAsSold] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [successData, setSuccessData] = useState<{
    productName: string
    amount: number
    productId: string | null
    customerPhone?: string
  } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  if (!isOpen) return null

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const handleProductSelect = (p: ProductOption) => {
    setSelectedProductId(p.id)
    setAmount(String(p.price))
    setCustomName(p.name)
    setMarkAsSold(p.is_available)
  }

  const handleCustomSelect = () => {
    setSelectedProductId('custom')
    setCustomName('')
    setAmount('')
    setMarkAsSold(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid sale price in ETB.')
      return
    }

    const prodName =
      selectedProductId === 'custom'
        ? customName.trim()
        : products.find((p) => p.id === selectedProductId)?.name || 'Direct Sale Product'

    if (!prodName) {
      setError('Please select or enter a product name.')
      return
    }

    setIsSubmitting(true)
    try {
      const finalProdId =
        selectedProductId === 'custom' || !selectedProductId ? null : selectedProductId

      const res = await recordDirectSale({
        productId: finalProdId,
        productName: selectedProductId === 'custom' ? prodName : undefined,
        amount: numAmount,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        channel,
        markAsSold: Boolean(markAsSold && finalProdId),
      })

      if (res.error) {
        setError(res.error)
      } else {
        setSuccessData({
          productName: prodName,
          amount: numAmount,
          productId: finalProdId,
          customerPhone: customerPhone.trim() || undefined,
        })
        if (onSuccess) onSuccess()
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to record direct sale.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate the shareable review link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kelalshop.com'
  const reviewUrl = successData?.productId
    ? `${origin}/products/${successData.productId}?rate=open`
    : shopperId
    ? `${origin}/shoppers/${shopperId}?rate=open`
    : `${origin}/dashboard/orders`

  const sellerDisplayName = shopperName || 'Verified Shopper'
  const shareMessage = `Hi! Thank you for purchasing "${successData?.productName}" from ${sellerDisplayName} on KelalShop. Please take 5 seconds to rate your experience: ${reviewUrl}`

  const handleCopyReviewLink = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      // fallback
    }
  }

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    reviewUrl
  )}&text=${encodeURIComponent(
    `Thank you for purchasing "${successData?.productName}" from ${sellerDisplayName}! Please take 5 seconds to leave a rating ⭐`
  )}`

  const handleClose = () => {
    setSuccessData(null)
    setSelectedProductId('')
    setCustomName('')
    setAmount('')
    setCustomerName('')
    setCustomerPhone('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-950">Record a Direct Sale</h3>
              <p className="text-xs text-slate-500">Log an offline sale made via phone, Telegram, or meetup</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── SUCCESS SCREEN WITH RATING SHARE LINK ─── */}
        {successData ? (
          <div className="p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-bold text-navy-950">Sale Successfully Recorded!</h4>
              <p className="text-xs text-slate-500">
                Added <strong className="text-emerald-600 font-bold">+{formatPrice(successData.amount)}</strong> to your revenue.
              </p>
            </div>

            {/* Rating invitation card */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-navy-950">Send Review Invite to Buyer</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Send this 1-click link to your buyer on Telegram or SMS so they can rate your store and boost your <strong>Trust Score ⭐</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-200/60 text-xs font-mono text-slate-700 truncate">
                <span className="truncate flex-1 select-all">{reviewUrl}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyReviewLink}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-navy-900 hover:bg-navy-800 text-white'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied Invite!' : 'Copy Invite Link'}</span>
                </button>

                <a
                  href={telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send on Telegram</span>
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-navy-950 text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ─── SALE ENTRY FORM ─── */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Product Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Select Product Sold
                </label>
                {selectedProductId && (
                  <button
                    type="button"
                    onClick={() => setSelectedProductId('')}
                    className="text-[11px] text-amber-600 font-semibold hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {!selectedProductId ? (
                <div className="space-y-2">
                  {/* Search filter for products */}
                  {products.length > 4 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search your listings..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Product Cards List */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleProductSelect(p)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                              Item
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-navy-900 group-hover:text-amber-700 truncate">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {p.is_available ? 'Available In Stock' : 'Marked as Sold'}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-amber-600 shrink-0 ml-2">
                          {formatPrice(p.price)}
                        </span>
                      </button>
                    ))}

                    {/* Option for unlisted custom item */}
                    <button
                      type="button"
                      onClick={handleCustomSelect}
                      className="w-full p-2.5 rounded-xl border border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 text-center text-xs font-bold text-amber-700 transition-colors"
                    >
                      + Custom / Unlisted Item
                    </button>
                  </div>
                </div>
              ) : selectedProductId === 'custom' ? (
                <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900">Custom / Unlisted Item</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter item name (e.g. Zara Jacket, Perfume)..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-navy-900 truncate">{customName}</div>
                      <div className="text-[10px] text-slate-500">Selected listing</div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-amber-600">{formatPrice(Number(amount))}</span>
                </div>
              )}
            </div>

            {/* Price & Channel Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Sale Price (ETB)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Br</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-amber-600 focus:border-amber-500 outline-none bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Sale Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-navy-900 focus:border-amber-500 outline-none bg-slate-50 focus:bg-white"
                >
                  <option value="phone">📞 Phone Call</option>
                  <option value="telegram">✈️ Telegram</option>
                  <option value="in_person">🤝 In Person / Meetup</option>
                  <option value="other">💬 Other Direct</option>
                </select>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Customer Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Liya Behailu"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-amber-500 outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Customer Phone <span className="text-slate-400 font-normal">(Recommended)</span>
                </label>
                <input
                  type="tel"
                  placeholder="0911223344"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-amber-500 outline-none bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Auto mark as sold checkbox */}
            {selectedProductId && selectedProductId !== 'custom' && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={markAsSold}
                  onChange={(e) => setMarkAsSold(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span className="text-xs text-navy-950 font-medium">
                  Automatically mark this item as <strong>Sold</strong> on your shop
                </span>
              </label>
            )}

            {/* Submit & Cancel Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Confirm Sale & Update Revenue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
