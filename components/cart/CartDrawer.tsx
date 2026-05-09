'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/context/CartContext'
import { formatPrice } from '@/lib/utils/formatters'

export function CartDrawer() {
  const { state, removeItem, updateQty, emptyCart, closeCart, subtotal } = useCart()
  const { items, isOpen } = state

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, closeCart])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="font-bold text-navy-900 text-base">
              Cart
              {items.length > 0 && (
                <span className="ml-2 text-xs font-semibold text-slate-500">({items.length} item{items.length !== 1 ? 's' : ''})</span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => emptyCart()}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
              >
                Clear all
              </button>
            )}
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 px-6">
              <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-center">
                <p className="font-semibold text-navy-900 text-sm">Your cart is empty</p>
                <p className="text-xs mt-1">Browse products and tap Add to Cart</p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold rounded-full text-sm transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 px-4 py-3.5 hover:bg-slate-50/60 transition-colors">
                  {/* Image */}
                  <Link
                    href={`/products/${item.product.id}`}
                    onClick={closeCart}
                    className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100"
                  >
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.id}`}
                      onClick={closeCart}
                      className="text-sm font-semibold text-navy-900 line-clamp-2 hover:text-amber-600 transition-colors leading-snug"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">by {item.product.shopperName}</p>
                    <p className="text-sm font-bold text-amber-600 mt-1">{formatPrice(item.product.price)}</p>
                  </div>

                  {/* Qty controls + remove */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      aria-label="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-navy-900 transition-colors text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold text-navy-900 w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-navy-900 transition-colors text-sm font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — checkout */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Subtotal</span>
              <span className="text-lg font-extrabold text-navy-900">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Direct payment to seller upon delivery.
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-navy-950 font-extrabold rounded-xl text-center text-sm transition-colors shadow-md shadow-amber-200"
            >
              Proceed to Checkout →
            </Link>
            <button
              onClick={closeCart}
              className="block w-full py-2.5 text-sm font-semibold text-slate-600 hover:text-navy-900 transition-colors text-center"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
