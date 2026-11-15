'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function TelegramRedirectContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')

  useEffect(() => {
    // Set tg_session cookie for embedded iframe/browser context
    document.cookie = 'tg_session=true; path=/; max-age=86400; SameSite=None; Secure'

    // If productId exists, redirect directly to that product page on the website.
    // Otherwise redirect to the main products storefront.
    const targetUrl = productId ? `/products/${productId}` : '/products'
    window.location.href = targetUrl
  }, [productId])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-base font-bold text-slate-800 tracking-tight">
        Kelal<span className="text-amber-500">Shop</span>
      </h2>
      <p className="text-xs text-slate-500 mt-1">Redirecting to website...</p>
    </div>
  )
}

export default function TelegramCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-500">Connecting to KelalShop...</p>
        </div>
      }
    >
      <TelegramRedirectContent />
    </Suspense>
  )
}
