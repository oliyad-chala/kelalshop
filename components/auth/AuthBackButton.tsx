'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getSafeRedirectPath } from '@/lib/utils/auth-redirect'

export function AuthBackButton() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleBack() {
    if (typeof window === 'undefined') {
      router.push('/')
      return
    }

    const redirectPath = getSafeRedirectPath(searchParams)

    // Helper: is a path protected or part of the auth flow?
    const isProtectedOrAuth = (path: string) =>
      path.startsWith('/dashboard') ||
      path.startsWith('/admin') ||
      path.startsWith('/auth')

    // 1. If redirectTo was a PUBLIC page (e.g. /products/123 or /shoppers/456), go back there!
    // NEVER send unauthenticated users to /dashboard or /admin on "Back" — that causes an infinite redirect loop!
    if (redirectPath && !isProtectedOrAuth(redirectPath)) {
      router.push(redirectPath)
      return
    }

    // 2. Check if the browser referrer was a public page from the same origin
    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer)
        if (
          refUrl.origin === window.location.origin &&
          !isProtectedOrAuth(refUrl.pathname)
        ) {
          router.push(refUrl.pathname + refUrl.search)
          return
        }
      } catch {}
    }

    // 3. Fallback: Safely return to the public home page
    router.push('/')
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="flex items-center gap-2 text-slate-600 hover:text-navy-900 transition-colors bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-slate-200/60 hover:bg-white active:scale-95"
      aria-label="Go back"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span className="font-medium text-sm">Back</span>
    </button>
  )
}
