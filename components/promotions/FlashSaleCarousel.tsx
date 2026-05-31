'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Database } from '@/types/database.types';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

type Promotion = Database['public']['Tables']['promotions']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type PromotionProduct = Database['public']['Tables']['promotion_products']['Row'] & {
  products: Product & { product_images: { url: string; is_primary: boolean }[] }
};

interface FlashSaleCarouselProps {
  campaign: Promotion;
  items: PromotionProduct[];
}

export function FlashSaleCarousel({ campaign, items }: FlashSaleCarouselProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date(campaign.end_date).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [campaign.end_date]);

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden my-8">
      <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-red-500 mr-2">⚡</span> 
            {campaign.name}
          </h2>
          <div className="flex items-center space-x-1 text-red-600 bg-red-50 px-3 py-1 rounded-full font-mono font-medium">
            <Clock className="w-4 h-4 mr-1" />
            <span>{String(timeLeft.days).padStart(2, '0')}d</span>
            <span>:</span>
            <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
            <span>:</span>
            <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
            <span>:</span>
            <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
        <Link href={`/promotions/${campaign.id}`} className="text-sm font-medium text-red-600 hover:text-red-700 mt-4 md:mt-0">
          View All Deals &rarr;
        </Link>
      </div>

      <div className="relative group">
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6 pt-4 px-6 space-x-4">
          {items.map((item) => {
            const primaryImage = item.products.product_images?.find(img => img.is_primary)?.url || item.products.product_images?.[0]?.url || '/placeholder.png';
            const originalPrice = item.products.price;
            const discountPercentage = Math.round(((originalPrice - item.special_price) / originalPrice) * 100);

            return (
              <Link key={item.product_id} href={`/products/${item.product_id}`} className="snap-start flex-shrink-0 w-48 group/item">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                  <Image src={primaryImage} alt={item.products.name} fill className="object-cover group-hover/item:scale-105 transition-transform duration-300" />
                  {discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{discountPercentage}%
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-900 truncate">{item.products.name}</h3>
                <div className="mt-1 flex items-baseline space-x-2">
                  <span className="text-lg font-bold text-red-600">${item.special_price.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}
