'use client'

import { useState, useEffect } from 'react'

export function FlashCountdown({ endsAt }: { endsAt?: string }) {
  const [secs, setSecs] = useState<number>(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const calculateRemaining = () => {
      if (!endsAt) return 5 * 3600 + 30 * 60 // Fallback mock
      const diff = new Date(endsAt).getTime() - Date.now()
      return Math.max(0, Math.floor(diff / 1000))
    }

    setSecs(calculateRemaining())
    
    const t = setInterval(() => {
      setSecs((s) => {
        if (s <= 1 && endsAt) return 0
        if (s <= 1 && !endsAt) return 5 * 3600 + 30 * 60
        return s - 1
      })
    }, 1000)
    
    return () => clearInterval(t)
  }, [endsAt])

  if (!mounted) return <div className="h-4 w-16 bg-slate-100 rounded animate-pulse"></div>

  if (secs <= 0 && endsAt) return <span className="text-red-500 font-bold text-[10px] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Expired</span>

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const p = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-0.5 shadow-sm">
      {[p(h), p(m), p(s)].map((unit, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className="bg-red-500 text-white text-[10px] font-bold font-mono px-1 py-0.5 rounded leading-none shadow-sm">
            {unit}
          </span>
          {i < 2 && <span className="text-red-500 font-bold text-xs leading-none drop-shadow-sm">:</span>}
        </span>
      ))}
    </div>
  )
}
