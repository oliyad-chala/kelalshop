'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const SLIDES = [
  {
    id: 1,
    tag: 'GLOBAL IMPORT MADE EASY',
    title: 'Shop the world.',
    titleHighlight: ' Pay locally.',
    desc: 'Connect with verified Ethiopian importers. Pay securely in ETB.',
    bgClass: 'from-amber-50 via-orange-50 to-orange-100 border-orange-200/40',
    tagClass: 'text-amber-700 bg-amber-200/60',
    highlightClass: 'text-amber-600',
    primaryBtn: { text: 'Discover Products', href: '/products' },
    secondaryBtn: { text: 'Find an Importer', href: '/shoppers' },
    icon: (
      <svg className="w-36 h-36 text-amber-400/25" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  {
    id: 2,
    tag: 'GLOBAL ACCESS',
    title: 'Buy from different stores.',
    titleHighlight: ' With local money.',
    desc: 'Shop from any international marketplace and pay securely in ETB.',
    bgClass: 'from-red-50 via-rose-50 to-red-100 border-red-200/40',
    tagClass: 'text-red-700 bg-red-200/60',
    highlightClass: 'text-red-600',
    primaryBtn: { text: 'Browse Catalog', href: '/products' },
    secondaryBtn: null,
    icon: (
      <svg className="w-36 h-36 text-red-400/25" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    )
  },
  {
    id: 3,
    tag: 'VERIFIED SHOPPERS',
    title: 'Get it delivered.',
    titleHighlight: ' Safely.',
    desc: 'Our verified Ethiopian importers will bring your items directly to you.',
    bgClass: 'from-blue-50 via-sky-50 to-blue-100 border-blue-200/40',
    tagClass: 'text-blue-700 bg-blue-200/60',
    highlightClass: 'text-blue-600',
    primaryBtn: { text: 'Find a Shopper', href: '/shoppers' },
    secondaryBtn: null,
    icon: (
      <svg className="w-36 h-36 text-blue-400/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
]

export function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrent((prev) => (prev + 1) % SLIDES.length)
  const prevSlide = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)

  return (
    <div className="relative w-full h-[200px] sm:h-[240px] md:h-[260px] rounded-xl overflow-hidden group shadow-sm border border-slate-200/40 bg-white">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex bg-gradient-to-r ${slide.bgClass} ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Text content */}
          <div className="relative z-10 p-5 sm:p-8 flex flex-col justify-center h-full w-full md:w-[60%]">
            <span className={`inline-block px-2 py-0.5 mb-2 text-[10px] font-bold tracking-wider rounded-full w-fit ${slide.tagClass}`}>
              {slide.tag}
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-navy-950 tracking-tight leading-tight mb-2">
              {slide.title}<br className="hidden sm:block" />
              <span className={slide.highlightClass}>{slide.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mb-4 max-w-xs hidden sm:block leading-relaxed">
              {slide.desc}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link
                href={slide.primaryBtn.href}
                className="inline-flex items-center px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-md transition-colors"
              >
                {slide.primaryBtn.text}
              </Link>
              {slide.secondaryBtn && (
                <Link
                  href={slide.secondaryBtn.href}
                  className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-navy-900 text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors"
                >
                  {slide.secondaryBtn.text}
                </Link>
              )}
            </div>
          </div>

          {/* Right graphic */}
          <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-[40%] items-center justify-center pointer-events-none overflow-hidden">
            <div className="absolute w-48 h-48 bg-white/20 rounded-full blur-3xl" />
            {slide.icon}
          </div>
        </div>
      ))}

      {/* Slider controls */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all ${
              i === current ? 'w-5 bg-navy-900' : 'w-1.5 bg-navy-900/20 hover:bg-navy-900/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
