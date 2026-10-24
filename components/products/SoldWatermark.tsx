import React from 'react'

interface SoldWatermarkProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  showBackdrop?: boolean
}

export function SoldWatermark({
  size = 'md',
  text = 'SOLD',
  className = '',
  showBackdrop = true,
}: SoldWatermarkProps) {
  const badgeSizes = {
    sm: 'text-[10px] tracking-[0.16em] px-2.5 py-0.5 gap-1.5 rounded-full',
    md: 'text-[11px] sm:text-xs tracking-[0.2em] px-3.5 py-1.5 gap-2 rounded-full',
    lg: 'text-xs sm:text-sm tracking-[0.25em] px-5 py-2.5 gap-2.5 rounded-full',
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-1.5 h-1.5 sm:w-2 sm:h-2',
    lg: 'w-2 h-2 sm:w-2.5 sm:h-2.5',
  }

  return (
    <div
      className={`absolute inset-0 z-20 pointer-events-none select-none flex items-center justify-center transition-all duration-300 ${
        showBackdrop ? 'bg-slate-950/15 group-hover:bg-slate-950/20' : ''
      } ${className}`}
      aria-label={text}
    >
      <div
        className={`inline-flex items-center font-medium uppercase text-white bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-lg transition-transform duration-300 group-hover:scale-105 ${badgeSizes[size]}`}
        style={{
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        <span
          className={`rounded-full bg-rose-500 shadow-sm shrink-0 animate-pulse ${dotSizes[size]}`}
          style={{ boxShadow: '0 0 8px rgba(244, 63, 94, 0.8)' }}
        />
        <span className="font-semibold text-slate-100">{text}</span>
      </div>
    </div>
  )
}
