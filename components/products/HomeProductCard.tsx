'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatETB } from '@/lib/utils/formatters'
import type { ProductWithDetails } from '@/types/app.types'
import { useCart } from '@/lib/context/CartContext'
import { toggleWishlist } from '@/lib/actions/wishlist'

interface HomeProductCardProps {
  product: ProductWithDetails
  /** e.g. 20 = 20% off; shows discount badge + struck-through original price */
  discount?: number
}

export function HomeProductCard({ product, discount }: HomeProductCardProps) {
  const { addItem } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const [liked, setLiked] = useState(false)

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.url ||
    product.product_images?.[0]?.url

  const discountedPrice = product.price
  const originalPrice = discount
    ? Math.round(product.price / (1 - discount / 100))
    : null

  const fmtPrice = (n: number) => formatETB(n).replace('ETB', '').trim()

  const rating = product.profiles?.trust_score
    ? (product.profiles.trust_score / 20).toFixed(1)
    : '4.8'

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setAdded(true)
    setTimeout(() => setAdded(false), 1800)

    await addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock ?? 99,
      is_available: product.is_available,
      image: primaryImage ?? null,
      shopperName: product.profiles?.full_name ?? '',
      shopperId: String(product.profiles?.id ?? ''),
    })
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:border-amber-200 hover:shadow-lg transition-all duration-200 flex flex-col group relative h-full">

      {/* Wishlist */}
      <button
        onClick={async (e) => {
          e.preventDefault()
          e.stopPropagation()
          setLiked(!liked)
          await toggleWishlist(product.id)
        }}
        className={`absolute top-2 right-2 z-10 p-1 rounded-full backdrop-blur-sm shadow-sm transition-colors ${
          liked ? 'bg-red-50 text-red-500' : 'bg-white/80 text-slate-300 hover:bg-red-50 hover:text-red-500'
        }`}
        aria-label="Add to wishlist"
      >
        <svg className="w-3.5 h-3.5 transition-transform active:scale-75" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Discount badge */}
      {discount && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none">
          -{discount}%
        </div>
      )}

      {/* Image */}
      <Link href={`/products/${product.id}`} className="block relative aspect-square bg-slate-50 overflow-hidden shrink-0">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Verified badge overlay */}
        {product.shopper_profiles?.verification_status === 'verified' && (
          <div className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 shadow-sm border border-emerald-100">
            <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd" />
            </svg>
            Verified
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-2.5 flex flex-col flex-1 relative">
        <Link href={`/products/${product.id}`} className="flex-1 block focus:outline-none group/title">
          {/* Invisible overlay to make the whole bottom area clickable, but under the buttons */}
          <span className="absolute inset-0 z-0" aria-hidden="true" />
          <h3 className="text-xs font-medium text-navy-900 line-clamp-2 leading-snug mb-1.5 group-hover/title:text-amber-600 transition-colors relative z-0">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 relative z-10">
          <div className="space-y-1">
            {/* Price row */}
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-sm font-bold text-navy-950">
                <span className="text-[10px] font-semibold mr-0.5">Br</span>
                {fmtPrice(discountedPrice)}
              </span>
              {originalPrice && (
                <span className="text-[10px] text-slate-400 line-through">
                  {fmtPrice(originalPrice)}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{rating}</span>
            </div>
          </div>

          {/* Add to Cart button (Small Icon) */}
          <button
            onClick={handleAddToCart}
            disabled={!product.is_available}
            aria-label="Add to cart"
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
              added
                ? 'bg-green-500 text-white scale-110'
                : product.is_available
                  ? 'bg-amber-100 hover:bg-amber-500 text-amber-600 hover:text-white active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {added ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
