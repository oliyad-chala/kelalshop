'use client'

import { useState } from 'react'
import { Link as LinkIcon, Check, Share2 } from 'lucide-react'

export default function ShareButtons() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (typeof window === 'undefined') return
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = () => {
    if (typeof window === 'undefined') return
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-amber-400 hover:text-amber-500 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-600">Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={handleNativeShare}
          className="flex items-center justify-center p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-amber-400 hover:text-amber-500 transition-all active:scale-95 cursor-pointer"
          title="Share Article"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
