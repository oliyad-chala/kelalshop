'use client'

import { useState, useEffect } from 'react'

export function FlashCountdown() {
  const [secs, setSecs] = useState(5 * 3600 + 30 * 60)

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s <= 1 ? 5 * 3600 + 30 * 60 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const p = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-0.5">
      {[p(h), p(m), p(s)].map((unit, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className="bg-red-500 text-white text-[10px] font-bold font-mono px-1 py-0.5 rounded leading-none">
            {unit}
          </span>
          {i < 2 && <span className="text-red-500 font-bold text-xs leading-none">:</span>}
        </span>
      ))}
    </div>
  )
}
