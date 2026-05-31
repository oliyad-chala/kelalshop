'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getSafeRedirectPath } from '@/lib/utils/auth-redirect'

export function AuthBackButton() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleBack() {
    const redirectPath = getSafeRedirectPath(searchParams)
    if (redirectPath) {
      router.push(redirectPath)
      return
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/')
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="flex items-center gap-2 text-slate-600 hover:text-navy-900 transition-colors bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-slate-200/50"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span className="font-medium text-sm">Back</span>
    </button>
  )
}
