import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatPrice } from '@/lib/utils/formatters'
import type { ProductWithDetails } from '@/types/app.types'

interface ProductCardProps {
  product: ProductWithDetails
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.product_images.find((img) => img.is_primary)?.url || product.product_images[0]?.url

  return (
    <Link href={`/products/${product.id}`} className="block h-full">
      <Card hover padding="none" className="h-full flex flex-col overflow-hidden">
        {/* Image Hub */}
        <div className="relative aspect-square bg-slate-100 overflow-hidden shrink-0">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {!product.is_available && (
              <Badge variant="danger">Out of Stock</Badge>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <Badge variant="warning">Only {product.stock} left</Badge>
            )}
          </div>
        </div>

        {/* Content Hub */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            {product.categories && (
              <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                {product.categories.name}
              </span>
            )}
            {product.location && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {product.location}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-navy-900 leading-tight mb-2 line-clamp-2 title-hover">
            {product.name}
          </h3>

          <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Avatar src={product.profiles.avatar_url} name={product.profiles.full_name} size="xs" />
              <div className="text-xs text-slate-600 truncate max-w-[80px]">
                {product.profiles.full_name?.split(' ')[0]}
              </div>
              {product.shopper_profiles?.verification_status === 'verified' && (
                <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="font-bold text-lg text-amber-600">
              {formatPrice(product.price).split(' ')[0]} {/* Only show ETB on card */}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
