'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ZoomIn, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { SoldWatermark } from '@/components/products/SoldWatermark'

interface ProductGalleryProps {
  images: { url: string; is_primary?: boolean }[]
  productName: string
  isSold?: boolean
}

export function ProductGallery({ images, productName, isSold = false }: ProductGalleryProps) {
  // Sort to put primary image first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1
    if (b.is_primary) return 1
    return 0
  })

  // Extract URLs
  const imageUrls = sortedImages.map((img) => img.url)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const showThumbnails = imageUrls.length > 1

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1))
  }, [imageUrls.length])

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActiveIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0))
  }, [imageUrls.length])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, handlePrev, handleNext])

  if (!imageUrls.length) {
    return (
      <div className="w-full aspect-square bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
        <svg className="w-20 h-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 h-full select-none">
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Header Controls */}
          <div
            className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20">
                {activeIndex + 1} / {imageUrls.length}
              </span>
              <span className="text-xs text-white/70 truncate max-w-[200px] sm:max-w-md">
                {productName}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/20"
              aria-label="Close image viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Image */}
          <div
            className="relative w-full h-[75vh] max-w-5xl flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrls[activeIndex]}
              alt={`${productName} full view ${activeIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />

            {/* Prev / Next buttons inside lightbox */}
            {showThumbnails && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/20 shadow-lg active:scale-95"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/20 shadow-lg active:scale-95"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {showThumbnails && (
            <div
              className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 overflow-x-auto py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-black/40 shrink-0 ${
                    idx === activeIndex
                      ? 'border-amber-400 scale-105'
                      : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Thumbnails (Left side on desktop, bottom on mobile) */}
      {showThumbnails && (
        <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto w-full md:w-20 shrink-0 scrollbar-hide snap-x">
          {imageUrls.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl overflow-hidden border-2 bg-slate-50 transition-all duration-200 snap-center p-1 flex items-center justify-center ${
                idx === activeIndex
                  ? 'border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                  : 'border-slate-200/80 hover:border-amber-300 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={url}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Product Image Container */}
      <div
        className="relative flex-1 aspect-square bg-slate-50/80 rounded-3xl overflow-hidden group cursor-zoom-in border border-slate-200/80 flex items-center justify-center shadow-xs"
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={imageUrls[activeIndex]}
          alt={productName}
          fill
          priority
          className="object-contain p-3 sm:p-5 transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Hover / Click to zoom hint badge */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-700 shadow-sm border border-slate-200/60 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 pointer-events-none">
          <ZoomIn className="w-3.5 h-3.5 text-amber-500" />
          <span>Click to zoom</span>
        </div>

        {/* Image Counter Badge (top-left) */}
        {showThumbnails && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-600 shadow-xs border border-slate-200/60">
            {activeIndex + 1} / {imageUrls.length}
          </div>
        )}

        {/* Prev / Next Arrows overlay for quick switching on main view */}
        {showThumbnails && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-200/60 active:scale-95"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-200/60 active:scale-95"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {isSold && <SoldWatermark size="lg" />}
      </div>
    </div>
  )
}
