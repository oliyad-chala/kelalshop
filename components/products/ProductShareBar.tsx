'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface ProductShareBarProps {
  productName: string
  productId: string
}

export function ProductShareBar({ productName, productId }: ProductShareBarProps) {
  const [copied, setCopied] = useState(false)

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/products/${productId}`
    }
    return `https://kelalshop.com/products/${productId}`
  }

  const handleCopy = async () => {
    const url = getShareUrl()
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const shareUrl = getShareUrl()
  const telegramText = `Check out "${productName}" on KelalShop!`
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(telegramText)}`
  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${telegramText} ${shareUrl}`)}`

  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
        <Share2 className="w-3.5 h-3.5 text-slate-400" />
        <span>Share:</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Telegram */}
        <a
          href={telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold transition-colors"
          title="Share to Telegram channel or friend"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          <span>Telegram</span>
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition-colors"
          title="Share on WhatsApp"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 0C5.397 0 0 5.397 0 12.031c0 2.115.549 4.181 1.594 5.996L0 24l6.135-1.611a11.966 11.966 0 005.896 1.543c6.634 0 12.031-5.397 12.031-12.031C24.062 5.397 18.665 0 12.031 0zm0 22.012a9.97 9.97 0 01-5.088-1.389l-.365-.217-3.778.991 1.008-3.684-.238-.379a9.96 9.96 0 01-1.534-5.302c0-5.51 4.485-9.995 9.995-9.995 5.51 0 9.995 4.485 9.995 9.995 0 5.51-4.485 9.995-9.995 9.995zm5.474-7.484c-.3-.15-1.774-.875-2.049-.975-.275-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.266-.467-2.411-1.488-.891-.795-1.493-1.777-1.668-2.077-.175-.3-.019-.462.131-.611.135-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.584-.492-.505-.675-.514-.175-.009-.375-.011-.575-.011s-.525.075-.8.375c-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.115 3.23 5.124 4.53 3.009 1.3 3.009.867 3.559.813.55-.054 1.774-.725 2.024-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z" />
          </svg>
          <span>WhatsApp</span>
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Copy direct product link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

