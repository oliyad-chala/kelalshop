'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Phone, PhoneCall, Copy, Check, MessageSquare, ShieldCheck, MapPin, X, Send } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ShopperBadge } from '@/components/shoppers/ShopperBadge'
import { formatPrice } from '@/lib/utils/formatters'
import { saveContactedProduct } from '@/lib/utils/contacted-items'

interface ContactSellerModalProps {
  isOpen: boolean
  onClose: () => void
  seller: {
    id?: string
    name?: string
    phone?: string | null
    avatarUrl?: string | null
    location?: string | null
    verificationStatus?: string | null
  }
  product: {
    id: string
    name: string
    price: number
    image?: string | null
    location?: string | null
  }
  isSold?: boolean
  currentUserId?: string | null
}

function formatPhoneDisplay(rawPhone: string): string {
  const cleaned = rawPhone.trim()
  // Format Ethiopian mobile: 0912345678 -> 091 234 5678
  if (/^0[79]\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  // Format international +251912345678 -> +251 91 234 5678
  if (/^\+251[79]\d{8}$/.test(cleaned)) {
    return `+251 ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }
  return cleaned
}

function getTelHref(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/[^\d+]/g, '')
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return `tel:+251${digitsOnly.slice(1)}`
  }
  return `tel:${digitsOnly}`
}

function getTelegramHref(rawPhone: string): string | null {
  const digitsOnly = rawPhone.replace(/[^\d]/g, '')
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return `https://t.me/+251${digitsOnly.slice(1)}`
  }
  if (digitsOnly.startsWith('251') && digitsOnly.length === 12) {
    return `https://t.me/+${digitsOnly}`
  }
  return null
}

export function ContactSellerModal({
  isOpen,
  onClose,
  seller,
  product,
  isSold,
  currentUserId,
}: ContactSellerModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Record this product in contacted history
      saveContactedProduct({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        productImage: product.image,
        sellerId: seller.id,
        sellerName: seller.name,
        sellerPhone: seller.phone,
        sellerLocation: product.location || seller.location || null,
        channel: 'phone',
      })
    } else {
      document.body.style.overflow = ''
      setCopied(false)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, product.id, product.name, product.price, product.image, product.location, seller.id, seller.name, seller.phone, seller.location])

  if (!isOpen) return null

  const rawPhone = seller.phone?.trim() || null
  const displayPhone = rawPhone ? formatPhoneDisplay(rawPhone) : null
  const telHref = rawPhone ? getTelHref(rawPhone) : null
  const telegramHref = rawPhone ? getTelegramHref(rawPhone) : null
  const location = product.location || seller.location || null

  const logInquiry = (channel: 'phone' | 'telegram' | 'chat') => {
    saveContactedProduct({
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: product.image,
      sellerId: seller.id,
      sellerName: seller.name,
      sellerPhone: seller.phone,
      sellerLocation: location,
      channel,
    })
  }

  const handleCopy = async () => {
    if (!rawPhone) return
    try {
      await navigator.clipboard.writeText(rawPhone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-950">Contact Seller</h3>
              <p className="text-[11px] text-slate-500">
                {isSold ? 'Ask seller about restock or availability' : 'Connect directly to negotiate or buy'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Product Mini Strip */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                Item
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-navy-900 truncate">{product.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-extrabold text-amber-600">{formatPrice(product.price)}</span>
                {isSold && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    Sold Out
                  </span>
                )}
              </div>
            </div>
            {location && (
              <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {location}
              </span>
            )}
          </div>

          {/* Sold Notice if applicable */}
          {isSold && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">📦</span>
              <p className="leading-relaxed">
                This item is currently marked as <strong>Sold</strong>. You can call or chat with the seller to ask if they have more in stock or can arrange another one for you.
              </p>
            </div>
          )}

          {/* Seller Profile Summary */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-slate-50 border border-amber-100/70">
            <Avatar 
              src={seller.avatarUrl || undefined} 
              name={seller.name || 'Shopper'} 
              size="lg" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-navy-950 truncate">
                  {seller.name || 'Verified Shopper'}
                </span>
                <ShopperBadge 
                  status={(seller.verificationStatus as any) || 'verified'} 
                  showText={false} 
                />
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>Direct Seller</span>
                {location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      {location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          {rawPhone ? (
            <div className="space-y-3">
              {/* Phone Highlight Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase mb-1">
                  Phone Number
                </div>
                <div className="text-2xl font-black tracking-wide text-white font-mono select-all">
                  {displayPhone}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Available for phone calls & direct inquiries
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* Call Now */}
                <a
                  href={telHref!}
                  onClick={() => logInquiry('phone')}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Now</span>
                </a>

                {/* Copy Number */}
                <button
                  onClick={() => {
                    logInquiry('phone')
                    handleCopy()
                  }}
                  className={`flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl text-sm border transition-all active:scale-[0.98] ${
                    copied
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-navy-900'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy Number</span>
                    </>
                  )}
                </button>
              </div>

              {/* Telegram Link (if mobile) */}
              {telegramHref && (
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => logInquiry('telegram')}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-100 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                  <span>Open in Telegram</span>
                </a>
              )}
            </div>
          ) : (
            /* Fallback if Seller Hasn't Provided a Phone */
            <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-navy-950">
                No phone number listed
              </div>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                This seller has not published their phone number yet. You can chat with them directly on KelalShop.
              </p>
            </div>
          )}

          {/* Internal Chat Option */}
          <Link
            href={
              currentUserId
                ? `/dashboard/chat/dm/${seller.id || 'mock'}`
                : `/auth/login?redirectTo=${encodeURIComponent(`/products/${product.id}`)}`
            }
            onClick={() => {
              logInquiry('chat')
              onClose()
            }}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Send Message on KelalShop</span>
          </Link>

          {/* Safety Notice */}
          <div className="pt-2 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-snug">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-700 font-semibold">Buyer Safety:</strong> Inspect the product in person before making any payment. Always meet in safe public areas.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
