'use client'

import Link from 'next/link'
import { HomeProductCard } from '@/components/products/HomeProductCard'
import { FlashCountdown } from '@/components/home/FlashCountdown'
import type { ProductWithDetails } from '@/types/app.types'
import { Database } from '@/types/database.types'

type Promotion = Database['public']['Tables']['promotions']['Row']
type Product = Database['public']['Tables']['products']['Row']
type PromotionProduct = Database['public']['Tables']['promotion_products']['Row'] & {
  products: Product & {
    product_images: { url: string; is_primary: boolean }[]
    profiles?: ProductWithDetails['profiles']
    shopper_profiles?: ProductWithDetails['shopper_profiles']
  }
}

interface FlashSaleCarouselProps {
  campaign: Promotion
  items: PromotionProduct[]
}

function toFlashCard(item: PromotionProduct, endsAt: string) {
  const product = item.products
  const originalPrice = Number(product.price)
  const salePrice = Number(item.special_price)
  const discount =
    originalPrice > salePrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : 0

  const cardProduct = {
    ...product,
    price: salePrice,
  } as ProductWithDetails

  return { product: cardProduct, discount, endsAt }
}

export function FlashSaleCarousel({ campaign, items }: FlashSaleCarouselProps) {
  const availableItems = items.filter(
    (item) => item.products && item.products.is_available !== false
  )

  if (availableItems.length === 0) return null

  const flashCards = availableItems.map((item) => toFlashCard(item, campaign.end_date))

  return (
    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base leading-none">⚡</span>
            <h2 className="text-sm font-bold text-navy-900">{campaign.name}</h2>
            <FlashCountdown endsAt={campaign.end_date} />
          </div>
          <Link
            href={`/promotions/${campaign.id}`}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
          >
            See All →
          </Link>
        </div>

        <div className="flex lg:grid lg:grid-cols-6 gap-3 md:gap-4 lg:gap-5 overflow-x-auto lg:overflow-visible scrollbar-hide p-3 md:p-5 scroll-snap-x lg:scroll-snap-none">
          {flashCards.map(({ product, discount, endsAt }) => (
            <div
              key={product.id}
              className="shrink-0 w-[140px] sm:w-[160px] md:w-[200px] lg:w-auto scroll-snap-item"
            >
              <HomeProductCard product={product} discount={discount} endsAt={endsAt} />
            </div>
          ))}

          <div className="shrink-0 w-[100px] sm:w-[120px] md:w-[160px] lg:w-auto scroll-snap-item">
            <Link
              href={`/promotions/${campaign.id}`}
              className="h-full min-h-[180px] md:min-h-[200px] lg:min-h-full flex flex-col items-center justify-center gap-2 md:gap-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors text-amber-600 font-bold text-xs md:text-sm text-center p-3"
            >
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
              See All Deals
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
