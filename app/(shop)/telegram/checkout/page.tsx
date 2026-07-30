'use client'

import { useEffect, useState, useTransition } from 'react'
import { verifyTelegramWebAppData, executeTelegramCheckout } from '@/lib/actions/telegram-checkout'
import { formatPrice } from '@/lib/utils/formatters'
import Image from 'next/image'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    stock: number
    image: string | null
    shopperId: string
  }
}

export default function TelegramCheckoutPage() {
  const [initData, setInitData] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  
  const [isPending, startTransition] = useTransition()
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)

  useEffect(() => {
    // 1. Ensure Telegram WebApp script is loaded
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      const data = tg.initData
      setInitData(data || null)
      
      if (!data) {
        setError('Please open this page directly inside your Telegram Bot.')
        setLoading(false)
        return
      }

      // Verify and load session
      startTransition(async () => {
        try {
          const res = await verifyTelegramWebAppData(data)
          if (res.success) {
            setProfile(res.profile)
            setCartItems(res.items || [])
          } else {
            setError(res.message || res.error || 'Failed to authenticate Telegram session.')
          }
        } catch (err: any) {
          setError(err.message || 'Error verifying Telegram session.')
        } finally {
          setLoading(false)
        }
      })
    } else {
      // Retry loading after a short delay in case script is still parsing
      const timer = setTimeout(() => {
        const retryTg = (window as any).Telegram?.WebApp
        if (retryTg) {
          retryTg.ready()
          retryTg.expand()
          setInitData(retryTg.initData || null)
          if (retryTg.initData) {
            startTransition(async () => {
              try {
                const res = await verifyTelegramWebAppData(retryTg.initData)
                if (res.success) {
                  setProfile(res.profile)
                  setCartItems(res.items || [])
                } else {
                  setError(res.message || res.error || 'Failed to authenticate Telegram session.')
                }
              } catch (err: any) {
                setError(err.message || 'Error verifying Telegram session.')
              } finally {
                setLoading(false)
              }
            })
            return
          }
        }
        setError('Telegram Web App SDK failed to initialize. Open in Telegram.')
        setLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingFee = 0 // Peer to peer direct coordination
  const grandTotal = subtotal + shippingFee

  const handleCheckout = () => {
    if (!initData || cartItems.length === 0) return
    setError(null)

    startTransition(async () => {
      try {
        const res = await executeTelegramCheckout(initData)
        if (res.success) {
          setCheckoutSuccess(true)
          const tg = (window as any).Telegram?.WebApp
          if (tg) {
            tg.showPopup({
              title: 'Order Placed!',
              message: 'Your order was successfully submitted! Coordinate payment and delivery directly with the shopper.',
              buttons: [{ type: 'ok', text: 'Done' }]
            }, () => {
              tg.close()
            })
          }
        }
      } catch (err: any) {
        setError(err.message || 'Checkout failed.')
      }
    })
  }

  const handleClose = () => {
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.close()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Securing session...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-2xl mb-4 font-bold">⚠️</div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Checkout Error</h3>
        <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">{error}</p>
        <button
          onClick={handleClose}
          className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors hover:bg-slate-700"
        >
          Close App
        </button>
      </div>
    )
  }

  if (checkoutSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Order Confirmed!</h3>
        <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">
          Open the bot to view details and coordinate peer-to-peer delivery.
        </p>
        <button
          onClick={handleClose}
          className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors hover:bg-emerald-700"
        >
          Return to Chat
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto">
      
      {/* Mini App Header */}
      <div className="bg-white px-5 py-4 border-b border-slate-200 shadow-sm shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Mini App Checkout</h1>
          <p className="text-xs text-slate-500 mt-0.5">Welcome, {profile?.full_name || 'Buyer'}</p>
        </div>
        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items in Cart</h3>
        {cartItems.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex gap-3 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-xl relative overflow-hidden shrink-0 border border-slate-100">
              {item.product.image ? (
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xl">📦</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm truncate">{item.product.name}</h4>
              <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold text-slate-900">{formatPrice(item.product.price)}</span>
                <span className="text-xs font-medium text-slate-400">Total: {formatPrice(item.product.price * item.quantity)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Payment Warning Box */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Direct Payment</h4>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Payment is peer-to-peer directly to the shopper. You can pay via Telebirr, CBE transfer, or cash on delivery once terms are agreed in the chat!
          </p>
        </div>
      </div>

      {/* Checkout Footer Summary */}
      <div className="bg-white border-t border-slate-200 p-5 space-y-4 shrink-0 shadow-lg">
        <div className="space-y-1.5 text-sm text-slate-500">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium text-slate-800">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-green-600 font-medium">P2P Settle</span>
          </div>
          <hr className="border-slate-100 my-2" />
          <div className="flex justify-between text-base font-bold text-slate-900">
            <span>Grand Total</span>
            <span className="text-amber-500">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isPending || cartItems.length === 0}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Placing Order...
            </>
          ) : (
            'Confirm Checkout (Direct P2P)'
          )}
        </button>
      </div>
    </main>
  )
}
