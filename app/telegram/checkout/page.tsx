'use client'

import { useEffect } from 'react'

export default function TelegramCheckoutPage() {
  useEffect(() => {
    // Set a session cookie valid for 24 hours to signal to the middleware to relax CSP and X-Frame-Options
    document.cookie = "tg_session=true; path=/; max-age=86400; SameSite=None; Secure"
    
    // Redirect to the main storefront shop page
    window.location.href = '/'
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-600">Redirecting to KelalShop...</p>
    </div>
  )
}
