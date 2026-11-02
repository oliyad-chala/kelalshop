'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { ReviewShopperModal } from '@/components/reviews/ReviewShopperModal'

interface RateChatPartnerButtonProps {
  shopper: {
    id: string
    name: string
  }
}

export function RateChatPartnerButton({ shopper }: RateChatPartnerButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-semibold transition-colors shrink-0"
      >
        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
        <span>Rate Shopper</span>
      </button>

      <ReviewShopperModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        shopper={shopper}
        defaultChannel="in_app_chat"
      />
    </>
  )
}

