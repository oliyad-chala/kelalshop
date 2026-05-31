'use client'

import { useState, useEffect, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { ProductCard } from './ProductCard'
import { loadMoreProducts } from '@/lib/actions/feed'
import type { ProductWithDetails } from '@/types/app.types'

interface InfiniteProductGridProps {
  initialProducts: ProductWithDetails[]
  params: { q?: string; category?: string; min_price?: string; max_price?: string; sort?: string; view?: string }
}

const ITEMS_PER_PAGE = 12

export function InfiniteProductGrid({ initialProducts, params }: InfiniteProductGridProps) {
  const [products, setProducts] = useState<ProductWithDetails[]>(initialProducts)
  const [offset, setOffset] = useState(ITEMS_PER_PAGE)
  const [hasMore, setHasMore] = useState(initialProducts.length === ITEMS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const { ref, inView } = useInView()

  // Reset state when params change
  useEffect(() => {
    setProducts(initialProducts)
    setOffset(ITEMS_PER_PAGE)
    setHasMore(initialProducts.length === ITEMS_PER_PAGE)
  }, [initialProducts, params])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)

    try {
      const newProducts = await loadMoreProducts(offset, ITEMS_PER_PAGE, params)
      if (newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts])
        setOffset(prev => prev + ITEMS_PER_PAGE)
        if (newProducts.length < ITEMS_PER_PAGE) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more products', err)
    } finally {
      setIsLoading(false)
    }
  }, [offset, hasMore, isLoading, params])

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-32 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-bold text-navy-900 mb-2">No products found</h3>
        <p className="text-slate-500">We couldn't find anything matching your search or filter.</p>
      </div>
    )
  }

  return (
    <>
      <div className={params.view === 'list' ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} view={params.view as 'grid' | 'list' | undefined} />
        ))}
      </div>

      {hasMore && (
        <div ref={ref} className="w-full flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      )}
      
      {!hasMore && products.length > 0 && (
        <div className="w-full text-center py-8 text-sm text-slate-400 font-medium">
          You've reached the end of the list
        </div>
      )}
    </>
  )
}
