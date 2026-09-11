'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { COOKIE_CONSENT_KEY, isProduction } from '@/lib/supabase/cookie-config'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check if user already acknowledged cookie notice
    const hasConsent = document.cookie
      .split(';')
      .some((item) => item.trim().startsWith(`${COOKIE_CONSENT_KEY}=`))

    if (!hasConsent) {
      // Show subtle notification after brief initial render
      const timer = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    // Set 1-year essential cookie acknowledgment
    const maxAge = 60 * 60 * 24 * 365
    const secureFlag = isProduction || window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${COOKIE_CONSENT_KEY}=true; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Notice"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-200/80 text-navy-900 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 text-amber-600 text-lg">
            🍪
          </div>
          <div className="flex-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p className="font-semibold text-navy-950 mb-0.5">Essential Cookies Only</p>
            KelalShop uses strictly essential cookies to maintain your login session and secure checkout. We do not use third-party tracking or advertising cookies.{' '}
            <Link
              href="/privacy"
              className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
