'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Database } from '@/types/database.types'
import { CampaignBannerImage } from '@/components/promotions/CampaignBannerImage'

type Promotion = Database['public']['Tables']['promotions']['Row']

interface GeoPromoBannerProps {
  promotions: Promotion[]
}

function shippingDiscountLabel(pct: number | null): string | null {
  if (pct == null || pct <= 0) return null
  if (pct >= 100) return 'Free shipping'
  return `${Math.round(pct)}% off shipping`
}

function bannerDiscountLabel(promo: Promotion): string | null {
  if (promo.type === 'shipping') {
    return shippingDiscountLabel(promo.discount_percentage != null ? Number(promo.discount_percentage) : null)
  }
  if (promo.discount_percentage) {
    return `Up to ${promo.discount_percentage}% OFF`
  }
  return null
}

export function GeoPromoBanner({ promotions }: GeoPromoBannerProps) {
  const [activeBanner, setActiveBanner] = useState<Promotion | null>(null)

  useEffect(() => {
    if (promotions.length > 0) {
      setActiveBanner(promotions[0])
    }
  }, [promotions])

  if (!activeBanner) return null

  const hasImage = Boolean(activeBanner.banner_image_url)
  const isShipping = activeBanner.type === 'shipping'
  const isBanner = activeBanner.type === 'banner'

  if (!hasImage && !isShipping && !activeBanner.description) {
    return null
  }

  const ctaHref =
    activeBanner.type === 'flash_sale_campaign' && activeBanner.id
      ? `/promotions/${activeBanner.id}`
      : isShipping
        ? '/checkout'
        : isBanner
          ? '/products'
          : null

  const discountLine = bannerDiscountLabel(activeBanner)
  const ctaLabel = isShipping ? 'Shop with deal →' : 'View deals →'

  const inner = (
    <div className={`flex items-center justify-between px-6 py-4 ${!hasImage ? 'min-h-[88px]' : ''}`}>
      <div className="flex-1 min-w-0 pr-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          {activeBanner.name}
        </h2>
        {activeBanner.description && (
          <p className="text-white/90 text-sm mt-1 line-clamp-2">{activeBanner.description}</p>
        )}
        {discountLine && (
          <p className="text-white/90 font-medium mt-1">{discountLine}</p>
        )}
        {ctaHref && (
          <p className="text-white/80 text-sm font-semibold mt-2 underline-offset-2 group-hover:underline">
            {ctaLabel}
          </p>
        )}
      </div>
      {hasImage ? (
        <div className="flex-shrink-0 w-1/2 max-w-sm h-32 relative">
          <CampaignBannerImage
            src={activeBanner.banner_image_url!}
            alt={activeBanner.name}
            fill
            className="object-contain object-right"
          />
        </div>
      ) : null}
    </div>
  )

  const gradientClass = isShipping
    ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
    : 'bg-gradient-to-r from-red-600 to-orange-500'

  return (
    <div
      className={`w-full relative overflow-hidden ${gradientClass} rounded-xl shadow-md transition-transform hover:scale-[1.01]`}
    >
      {ctaHref ? (
        <Link href={ctaHref} className="block group cursor-pointer">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  )
}
