import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { formatPrice } from '@/lib/utils/formatters'
import type { ProductWithDetails } from '@/types/app.types'

interface ProductCardProps {
  product: ProductWithDetails
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.product_images?.find((img) => img.is_primary)?.url || product.product_images?.[0]?.url

  return (
    <Card hover padding="none" className="h-full flex flex-col overflow-hidden bg-white border border-slate-100 rounded-2xl relative group">
      {/* Wishlist Heart Icon */}
      <button className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/50 backdrop-blur-sm shadow-sm hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Product Image Area */}
      <Link href={`/products/${product.id}`} className="block relative aspect-square bg-slate-50 overflow-hidden shrink-0">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/products/${product.id}`} className="flex-1 block">
          <h3 className="font-medium text-navy-900 leading-tight mb-3 line-clamp-2 hover:text-amber-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-xl text-navy-950">
            {/* Split 'ETB 37.42' into 'Br 37.42' roughly based on user image */}
            <span className="text-sm font-semibold mr-1">Br</span>
            {formatPrice(product.price).replace(/[^0-9.,]/g, '')}
          </div>
          <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-amber-500 border border-amber-100 hover:bg-amber-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-1.5 pt-2 border-t border-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1 text-amber-400">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{product.profiles?.trust_score ? (product.profiles.trust_score / 20).toFixed(1) : '0'}</span>
            </div>
            <span>(0 Review)</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Minimum.order.quantity 1
          </div>
        </div>
      </div>
    </Card>
  )
}
