'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductGalleryProps {
  images: { url: string; is_primary?: boolean }[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  // Sort to put primary image first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1
    if (b.is_primary) return 1
    return 0
  })

  // Extract URLs
  const imageUrls = sortedImages.map((img) => img.url)
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomPosition, setZoomPosition] = useState('50% 50%')

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    // Calculate percentage position
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPosition(`${x}% ${y}%`)
  }

  if (!imageUrls.length) {
    return (
      <div className="w-full aspect-square bg-slate-100 rounded-2xl flex items-center justify-center">
        <svg className="w-20 h-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  const showThumbnails = imageUrls.length > 1

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 h-full">
      {/* Thumbnails (Left side on desktop, bottom on mobile) */}
      {showThumbnails && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto w-full md:w-20 shrink-0 scrollbar-hide snap-x">
          {imageUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 snap-center ${
                idx === activeIndex
                  ? 'border-amber-500 shadow-md'
                  : 'border-transparent hover:border-amber-200 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={url}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div 
        className="relative flex-1 aspect-square bg-slate-50 rounded-2xl overflow-hidden group cursor-crosshair border border-slate-100"
        onMouseMove={handleMouseMove}
      >
        <Image
          src={imageUrls[activeIndex]}
          alt={productName}
          fill
          priority
          className="object-cover transition-transform duration-200 ease-out group-hover:scale-150"
          style={{ transformOrigin: zoomPosition }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        {/* Optional zoom indicator hint */}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          Hover to zoom
        </div>
      </div>
    </div>
  )
}
