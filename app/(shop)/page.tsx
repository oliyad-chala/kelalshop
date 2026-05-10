import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HomeProductCard } from '@/components/products/HomeProductCard'
import { FlashCountdown } from '@/components/home/FlashCountdown'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { MOCK_PRODUCTS } from '@/lib/constants/mock-data'
import type { ProductWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'KelalShop — Ethiopian Marketplace',
  description:
    'Shop global products and pay locally in ETB. Connect with verified Ethiopian importers on KelalShop.',
}

export const dynamic = 'force-dynamic'

/* ─── Category definitions ───────────────────────────────────────────────── */

const CATEGORIES = [
  {
    name: 'Home & Living', href: 'Home & Living',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    name: 'Baby & Kids', href: 'Baby & Kids',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    name: 'Electronics', href: 'Electronics',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    name: 'Office & Tech', href: 'Office & Tech',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    name: 'Fashion', href: 'Fashion & Beauty',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  },
  {
    name: 'Vehicles', href: 'Vehicles',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  },
  {
    name: 'Wholesale', href: 'Wholesale',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    name: 'Sports', href: 'Sports',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    name: 'Food', href: 'Food & Grocery',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
]

/* ─── Trust strip ────────────────────────────────────────────────────────── */

const TRUST = [
  {
    title: 'Global Access',
    desc: 'From Alibaba, Amazon & more',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  },
  {
    title: 'Direct Payments',
    desc: 'Pay sellers directly on delivery',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  },
  {
    title: 'Verified Shoppers',
    desc: 'ID-verified importers only',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
]

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default async function Home() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [
    { data: activeBoosts },
    { data: recentProducts },
    { data: flashDealsRaw },
  ] = await Promise.all([
    // Get active boosts
    supabase
      .from('products')
      .select('*, product_images(*), profiles:shopper_id(id, full_name, avatar_url, trust_score, role, shopper_profiles(verification_status))')
      .eq('is_available', true)
      .gt('boosted_until', now)
      .order('boosted_until', { ascending: false })
      .limit(16),

    // Get recent normal products
    supabase
      .from('products')
      .select('*, product_images(*), profiles:shopper_id(id, full_name, avatar_url, trust_score, role, shopper_profiles(verification_status))')
      .eq('is_available', true)
      .or(`boosted_until.lt.${now},boosted_until.is.null`)
      .order('created_at', { ascending: false })
      .limit(16),

    // Real flash deals from DB
    supabase
      .from('flash_deals')
      .select('*, products(*, product_images(*), profiles:shopper_id(id, full_name, avatar_url, trust_score, shopper_profiles(verification_status)))')
      .eq('is_active', true)
      .gt('ends_at', now)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  // Combine boosts and recent products
  const combinedProducts = [...(activeBoosts ?? []), ...(recentProducts ?? [])]

  // Show all products regardless of verification status
  const verifiedProducts = combinedProducts

  const allProducts =
    verifiedProducts.length > 0
      ? (verifiedProducts as unknown as ProductWithDetails[])
      : (MOCK_PRODUCTS as unknown as ProductWithDetails[])

  const trendingProducts = allProducts.slice(0, 12)

  // Build flash deal items: real DB deals first, fall back to trending products with mock discounts
  type FlashItem = { product: ProductWithDetails; discount: number }
  const MOCK_DISCOUNTS = [25, 15, 30, 20, 10, 40]

  const flashItems: FlashItem[] =
    flashDealsRaw && flashDealsRaw.length > 0
      ? (flashDealsRaw as any[]).map((d) => ({
          product: d.products as ProductWithDetails,
          discount: d.discount_percent as number,
        }))
      : allProducts.slice(0, 5).map((p, i) => ({
          product: p,
          discount: MOCK_DISCOUNTS[i % MOCK_DISCOUNTS.length],
        }))

  return (
    <main className="flex-1 bg-slate-50 pb-20">

      {/* ── 1. HERO BANNER ─────────────────────────────────────────────── */}
      <section className="px-3 sm:px-4 pt-2 pb-2 max-w-[1400px] mx-auto">
        <HeroCarousel />
      </section>

      {/* ── 2. CATEGORIES ──────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-navy-900">Shop by Category</h2>
          <Link href="/products" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
            Browse All →
          </Link>
        </div>
        <div className="flex gap-3 sm:gap-5 md:justify-center md:gap-8 lg:gap-10 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={i}
              href={`/products?category=${encodeURIComponent(cat.href)}`}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-white border border-slate-100 shadow-sm text-navy-600 transition-all duration-200 group-hover:scale-110 group-hover:border-amber-300 group-hover:shadow-md group-hover:text-amber-600">
                {cat.icon}
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 group-hover:text-amber-600 transition-colors text-center leading-tight w-14">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. FLASH DEALS ─────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">⚡</span>
              <h2 className="text-sm font-bold text-navy-900">Flash Deals</h2>
              <FlashCountdown />
            </div>
            <Link href="/products" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
              See All →
            </Link>
          </div>
          {/* Scroll strip */}
          <div className="flex lg:grid lg:grid-cols-6 gap-3 md:gap-4 lg:gap-5 overflow-x-auto lg:overflow-visible scrollbar-hide p-3 md:p-5 scroll-snap-x lg:scroll-snap-none">
            {flashItems.map(({ product, discount }, i) => (
              <div key={`${product.id}-${i}`} className="shrink-0 w-[140px] sm:w-[160px] md:w-[200px] lg:w-auto scroll-snap-item">
                <HomeProductCard product={product} discount={discount} />
              </div>
            ))}
            {/* See More card */}
            <div className="shrink-0 w-[100px] sm:w-[120px] md:w-[160px] lg:w-auto scroll-snap-item">
              <Link
                href="/products"
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

      {/* ── 4. TRENDING PRODUCTS ───────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-navy-900">Trending Products</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Best deals from verified shoppers</p>
          </div>
          <Link
            href="/products"
            className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {trendingProducts.map((product) => (
            <HomeProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ── 5. MID-PAGE PROMO BANNERS ──────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/products"
            className="relative rounded-xl overflow-hidden h-24 sm:h-28 bg-gradient-to-r from-amber-400 to-orange-500 flex items-center px-5 group hover:from-amber-500 hover:to-orange-600 transition-all shadow-sm"
          >
            <div>
              <div className="text-[9px] font-bold text-amber-900/60 uppercase tracking-widest mb-1">KelalShop Exclusive</div>
              <div className="text-base sm:text-lg font-extrabold text-white leading-tight">
                Import Anything<br />From Anywhere
              </div>
              <div className="mt-1.5 text-[10px] font-semibold text-amber-900/70">
                Shop → Pay ETB → Receive
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/15 group-hover:text-white/25 transition-colors pointer-events-none">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
          </Link>

          <Link
            href="/shoppers"
            className="relative rounded-xl overflow-hidden h-24 sm:h-28 bg-gradient-to-r from-navy-700 to-navy-900 flex items-center px-5 group hover:from-navy-800 hover:to-navy-950 transition-all shadow-sm"
          >
            <div>
              <div className="text-[9px] font-bold text-blue-300/60 uppercase tracking-widest mb-1">Verified Importers</div>
              <div className="text-base sm:text-lg font-extrabold text-white leading-tight">
                Find a Trusted<br />Shopper Near You
              </div>
              <div className="mt-1.5 text-[10px] font-semibold text-blue-300/70">
                ID-verified • Direct Connection
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-hover:text-white/20 transition-colors pointer-events-none">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      {/* ── 6. TRUST STRIP ─────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3 mb-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {TRUST.map((item, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-navy-50 text-navy-600 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-bold text-navy-900 truncate">{item.title}</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 leading-snug">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
