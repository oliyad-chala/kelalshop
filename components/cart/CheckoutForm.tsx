'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/context/CartContext'
import { createOrder, type DeliveryDetails } from '@/lib/actions/orders'
import { clearCart } from '@/lib/actions/cart'
import { formatPrice } from '@/lib/utils/formatters'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, User, FileText } from 'lucide-react'

export type CheckoutShippingInfo = {
  baseFee: number
  fee: number
  discount: number
  promotionId: string | null
  promotionName: string | null
}

const ETHIOPIA_CITIES = [
  'Addis Ababa - Bole / Bole Mikael',
  'Addis Ababa - CMC / Ayat / Summit',
  'Addis Ababa - Sarbet / Old Airport / Bisrate Gabriel',
  'Addis Ababa - Piassa / Arat Kilo / Sidist Kilo',
  'Addis Ababa - Mexico / Kazanchis / Bambis',
  'Addis Ababa - Megenagna / Gerji / Hayahulet',
  'Addis Ababa - Lebu / Jemo / Bethel',
  'Addis Ababa - Other Sub-City',
  'Adama / Nazret',
  'Hawassa',
  'Bahir Dar',
  'Dire Dawa',
  'Gondar',
  'Jimma',
  'Other City (Specify in address)',
]

type CheckoutFormProps = {
  shipping?: CheckoutShippingInfo
  userProfile?: {
    fullName?: string
    phone?: string
  }
}

export function CheckoutForm({ shipping, userProfile }: CheckoutFormProps) {
  const { state, subtotal, emptyCart } = useCart()
  const { items } = state
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)

  // Delivery Details State
  const [fullName, setFullName] = useState(userProfile?.fullName || '')
  const [phone, setPhone] = useState(userProfile?.phone || '')
  const [city, setCity] = useState(ETHIOPIA_CITIES[0])
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const shippingFee = shipping?.fee ?? 0
  const shippingBase = shipping?.baseFee ?? 0
  const shippingDiscount = shipping?.discount ?? 0
  const hasShippingPromo = Boolean(shipping?.promotionId && shippingDiscount > 0)
  const grandTotal = subtotal + shippingFee

  const handlePlaceOrder = () => {
    if (items.length === 0) return
    setError(null)

    // Validation
    if (!phone.trim()) {
      setError('Please provide your phone number so the shopper can call you for delivery.')
      return
    }
    if (!address.trim()) {
      setError('Please provide your delivery address or nearest landmark.')
      return
    }

    setPlacing(true)
    startTransition(async () => {
      try {
        const promoId = shipping?.promotionId ?? null
        const deliveryPayload: DeliveryDetails = {
          fullName: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim(),
          notes: notes.trim() || undefined,
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          await createOrder(item.product.id, i === 0 ? promoId : null, deliveryPayload)
        }
        await clearCart()
        emptyCart()
        router.push('/dashboard/orders?ordered=1')
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to place order. Please try again.'
        setError(message)
        setPlacing(false)
      }
    })
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl">🛒</div>
        <h2 className="text-xl font-bold text-navy-900">Your cart is empty</h2>
        <p className="text-slate-500 text-sm">Add some products before checking out.</p>
        <Link
          href="/products"
          className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold rounded-xl text-sm transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {hasShippingPromo && shipping?.promotionName && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-medium">
          {shipping.promotionName} applied — you save {formatPrice(shippingDiscount)} on delivery
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-navy-900">Order Summary ({items.length} item{items.length !== 1 ? 's' : ''})</h2>
        </div>
        <ul className="divide-y divide-slate-50">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-6 py-4">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                {item.product.image ? (
                  <Image src={item.product.image} alt={item.product.name} fill unoptimized className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-2xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-900 truncate">{item.product.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">by {item.product.shopperName} · qty {item.quantity}</p>
              </div>
              <span className="font-bold text-navy-900 text-sm shrink-0">
                {item.product.price <= 0 ? 'Price on Call' : formatPrice(item.product.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Delivery Destination & Contact Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900 text-sm">Delivery Destination & Contact</h3>
              <p className="text-[11px] text-slate-400">Where the shopper will deliver your items</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Local Delivery
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0911... or +251 9..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Shopper will call you on this number</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy-900 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> City / Sub-City Area <span className="text-red-500">*</span>
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-navy-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          >
            {ETHIOPIA_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy-900 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Street Address / Nearest Landmark <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Bole Mikael, Behind Church, House #124"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Delivery Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Call 30 mins before arrival, deliver after 2:30 local"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span className="font-semibold text-navy-900">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Shipping</span>
          <span className="font-semibold text-navy-900">
            {hasShippingPromo && shippingBase > shippingFee ? (
              <>
                <span className="text-slate-400 line-through mr-2 font-normal">{formatPrice(shippingBase)}</span>
                {shippingFee <= 0 ? 'Free' : formatPrice(shippingFee)}
              </>
            ) : (
              formatPrice(shippingFee || shippingBase)
            )}
          </span>
        </div>
        <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-bold text-navy-900">
          <span>Total</span>
          <span className="text-amber-600">{formatPrice(grandTotal)}</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Product payment is direct to the seller on delivery. Shipping is charged once per checkout.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <button
        onClick={handlePlaceOrder}
        disabled={isPending || placing}
        className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-navy-950 font-extrabold rounded-xl text-base transition-colors shadow-lg shadow-amber-200"
      >
        {placing ? 'Placing Orders…' : `Place Order (Direct Payment) · ${formatPrice(grandTotal)}`}
      </button>
    </div>
  )
}
