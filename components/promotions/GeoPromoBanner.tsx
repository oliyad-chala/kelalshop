'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Database } from '@/types/database.types';

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

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.01]">
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
        </div>
        <div className="flex-shrink-0 w-1/2 max-w-sm h-32 relative">
           <Image
             src={activeBanner.banner_image_url}
             alt={activeBanner.name}
             fill
             className="object-contain object-right"
           />
        </div>
      </div>
    </div>
  );
}
