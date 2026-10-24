'use client'

import { useState, useTransition } from 'react'
import { toggleProductAvailability } from '@/lib/actions/products'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface ProductAvailabilityButtonProps {
  productId: string
  isAvailable: boolean
  variant?: 'button' | 'badge'
  className?: string
}

export function ProductAvailabilityButton({
  productId,
  isAvailable: initialAvailable,
  variant = 'button',
  className = '',
}: ProductAvailabilityButtonProps) {
  const [isAvailable, setIsAvailable] = useState(initialAvailable)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleToggle = () => {
    setErrorMsg(null)
    const nextState = !isAvailable
    setIsAvailable(nextState) // optimistic

    startTransition(async () => {
      try {
        // toggleProductAvailability expects (productId, currentAvailableState)
        await toggleProductAvailability(productId, isAvailable)
      } catch (err: unknown) {
        setIsAvailable(!nextState) // revert optimistic update
        const msg = err instanceof Error ? err.message : 'Failed to update product status.'
        setErrorMsg(msg)
        alert(msg)
      }
    })
  }

  if (variant === 'badge') {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        title={isAvailable ? 'Click to mark as Sold' : 'Click to mark as Available'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
          isAvailable
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
        } ${isPending ? 'opacity-60 cursor-wait' : 'cursor-pointer active:scale-95'} ${className}`}
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isAvailable ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        ) : (
          <XCircle className="w-3 h-3 text-rose-600" />
        )}
        <span>{isAvailable ? 'Available' : 'Sold'}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={isAvailable ? 'Mark this product as Sold' : 'Mark this product as Available'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
        isAvailable
          ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200'
          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
      } ${isPending ? 'opacity-60 cursor-wait' : 'active:scale-95'} ${className}`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isAvailable ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Mark Sold</span>
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Mark Available</span>
        </>
      )}
    </button>
  )
}
