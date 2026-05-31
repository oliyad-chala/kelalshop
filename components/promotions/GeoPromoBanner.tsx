'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database } from '@/types/database.types';
import { CampaignBannerImage } from '@/components/promotions/CampaignBannerImage';

type Promotion = Database['public']['Tables']['promotions']['Row'];

interface GeoPromoBannerProps {
  promotions: Promotion[];
}

export function GeoPromoBanner({ promotions }: GeoPromoBannerProps) {
  const [activeBanner, setActiveBanner] = useState<Promotion | null>(null);

  useEffect(() => {
    // Basic client-side rotation or just showing the first one
    if (promotions.length > 0) {
      setActiveBanner(promotions[0]);
    }
  }, [promotions]);

  if (!activeBanner || !activeBanner.banner_image_url) {
    return null;
  }

  const ctaHref =
    activeBanner.type === 'flash_sale_campaign' && activeBanner.id
      ? `/promotions/${activeBanner.id}`
      : activeBanner.type === 'banner'
        ? '/products'
        : null

  const inner = (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex-1">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          {activeBanner.name}
        </h2>
        {activeBanner.discount_percentage && (
          <p className="text-white/90 font-medium mt-1">
            Up to {activeBanner.discount_percentage}% OFF
          </p>
        )}
        {ctaHref && (
          <p className="text-white/80 text-sm font-semibold mt-2 underline-offset-2 group-hover:underline">
            View deals →
          </p>
        )}
      </div>
      <div className="flex-shrink-0 w-1/2 max-w-sm h-32 relative">
        <CampaignBannerImage
          src={activeBanner.banner_image_url}
          alt={activeBanner.name}
          fill
          className="object-contain object-right"
        />
      </div>
    </div>
  )

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 rounded-xl shadow-md transition-transform hover:scale-[1.01]">
      {ctaHref ? (
        <Link href={ctaHref} className="block group cursor-pointer">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
