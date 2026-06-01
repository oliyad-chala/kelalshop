'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/context/CartContext'
import { createOrder } from '@/lib/actions/orders'
import { clearCart } from '@/lib/actions/cart'
import { formatPrice } from '@/lib/utils/formatters'
import Image from 'next/image'
import Link from 'next/link'

export type CheckoutShippingInfo = {
  baseFee: number
  fee: number
  discount: number
  promotionId: string | null
  promotionName: string | null
}

type CheckoutFormProps = {
  shipping?: CheckoutShippingInfo
}

export function CheckoutForm({ shipping }: CheckoutFormProps) {
  const { state, subtotal, emptyCart } = useCart()
  const { items } = state
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)

  const shippingFee = shipping?.fee ?? 0
  const shippingBase = shipping?.baseFee ?? 0
  const shippingDiscount = shipping?.discount ?? 0
  const hasShippingPromo = Boolean(shipping?.promotionId && shippingDiscount > 0)
  const grandTotal = subtotal + shippingFee

  const handlePlaceOrder = () => {
    if (items.length === 0) return
    setError(null)
    setPlacing(true)
    startTransition(async () => {
      try {
        const promoId = shipping?.promotionId ?? null
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          await createOrder(item.product.id, i === 0 ? promoId : null)
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
                {formatPrice(item.product.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
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
