import { clsx } from 'clsx'

interface ShopperBadgeProps {
  status: 'unverified' | 'pending' | 'verified' | 'rejected'
  className?: string
  showText?: boolean
}

export function ShopperBadge({ status, className, showText = true }: ShopperBadgeProps) {
  if (status !== 'verified') {
    if (!showText) return null
    return (
      <span className={clsx("inline-flex items-center gap-1 text-xs font-medium text-slate-500", className)}>
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Unverified
      </span>
    )
  }

  return (
    <span className={clsx("inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100", className)}>
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {showText && "Verified Shopper"}
    </span>
  )
}
