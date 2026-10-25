'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PhoneCall, Send, Trash2, MapPin, ExternalLink, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils/formatters'
import { getContactedProducts, removeContactedProduct, ContactedProductItem } from '@/lib/utils/contacted-items'

export function ContactedItemsList() {
  const [items, setItems] = useState<ContactedProductItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setItems(getContactedProducts())
  }, [])

  const handleRemove = (productId: string) => {
    removeContactedProduct(productId)
    setItems(prev => prev.filter(i => i.productId !== productId))
  }

  if (!mounted) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading contacted items...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <PhoneCall className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-navy-950 mb-1">No contacted items yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
          When you view a seller's phone number or message them on Telegram, the product will be saved here so you can easily call or message them again.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>You contacted {items.length} seller(s)</span>
        <span>Saved on your device</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {items.map((item) => {
          const rawPhone = item.sellerPhone?.replace(/[^\d+]/g, '') || ''
          const telHref = rawPhone ? (rawPhone.startsWith('0') ? `tel:+251${rawPhone.slice(1)}` : `tel:${rawPhone}`) : null
          const telegramHref = rawPhone ? (rawPhone.startsWith('0') ? `https://t.me/+251${rawPhone.slice(1)}` : `https://t.me/+${rawPhone}`) : null

          return (
            <div
              key={item.productId}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-3 relative group"
            >
              {/* Product Info */}
              <div className="flex items-start gap-3">
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                    Item
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-600">
                      {formatPrice(item.productPrice)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.channel === 'telegram' ? '✈️ Telegram' : item.channel === 'chat' ? '💬 Chat' : '📞 Phone'}
                    </span>
                  </div>

                  <Link
                    href={`/products/${item.productId}`}
                    className="text-sm font-bold text-navy-950 hover:text-amber-600 transition-colors line-clamp-1 mt-0.5"
                  >
                    {item.productName}
                  </Link>

                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>Seller: <strong>{item.sellerName || 'Verified Shopper'}</strong></span>
                    {item.sellerLocation && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.sellerLocation}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                  title="Remove from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.contactedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>

                <div className="flex items-center gap-2">
                  {telHref && (
                    <a
                      href={telHref}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  )}

                  {telegramHref && (
                    <a
                      href={telegramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram</span>
                    </a>
                  )}

                  <Link
                    href={`/products/${item.productId}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-navy-950 text-xs font-medium transition-colors"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
