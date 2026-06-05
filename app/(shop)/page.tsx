import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HomeProductCard } from '@/components/products/HomeProductCard'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { MOCK_PRODUCTS } from '@/lib/constants/mock-data'
import type { ProductWithDetails } from '@/types/app.types'
import { getUserLocation } from '@/lib/utils/geo'
import { syncCampaignStatuses } from '@/lib/utils/campaign-status'
import { GeoPromoBanner } from '@/components/promotions/GeoPromoBanner'
import { FlashSaleCarousel } from '@/components/promotions/FlashSaleCarousel'
import { FlashSaleTeaser } from '@/components/promotions/FlashSaleTeaser'
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd'
import { SITE_URL } from '@/lib/seo/site'

export const metadata = {
  title: 'KelalShop — Ethiopian Marketplace',
  description:
    'Shop global products and pay locally in ETB. Connect with verified Ethiopian importers on KelalShop.',
  alternates: {
    canonical: SITE_URL,
  },
}

export const dynamic = 'force-dynamic'

/* ─── Category definitions ───────────────────────────────────────────────── */

import { Home as HomeIcon, Baby, Monitor, Briefcase, Shirt, Car, Package, Dumbbell, Utensils } from 'lucide-react'

const CATEGORIES = [
  {
    name: 'Home & Living', href: 'Home & Living',
    icon: <HomeIcon className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    name: 'Baby & Kids', href: 'Baby & Kids',
    icon: <Baby className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    name: 'Electronics', href: 'Electronics',
    icon: <Monitor className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    name: 'Office & Tech', href: 'Office & Tech',
    icon: <Briefcase className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    name: 'Fashion', href: 'Fashion & Beauty',
    icon: <Shirt className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    name: 'Vehicles', href: 'Vehicles',
    icon: <Car className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    name: 'Wholesale', href: 'Wholesale',
    icon: <Package className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    name: 'Sports', href: 'Sports',
    icon: <Dumbbell className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    name: 'Food', href: 'Food & Grocery',
    icon: <Utensils className="w-6 h-6" strokeWidth={1.5} />,
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

/* ─── Campaign flash deals (seller opt-in, admin approved only) ─────────── */

async function fetchApprovedCampaignProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  promotionId: string
) {
  const { data: items } = await supabase
    .from('promotion_products')
    .select(`
      *,
      products (
        *,
        product_images (url, is_primary),
        profiles:shopper_id (
          id,
          full_name,
          avatar_url,
          trust_score,
          role,
          shopper_profiles (verification_status)
        )
      )
    `)
    .eq('promotion_id', promotionId)
    .eq('status', 'approved')

  return (items ?? []).filter(
    (row: { products?: { is_available?: boolean } | null }) =>
      row.products?.is_available !== false
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default async function Home() {
  const supabase = await createClient()
  const admin = createAdminClient()
  await syncCampaignStatuses(admin)
  const now = new Date().toISOString()

  const [{ data: activeBoosts }, { data: recentProducts }] = await Promise.all([
    // Get active boosts
    supabase
      .from('products')
      .select('*, product_images(*), profiles:shopper_id(id, full_name, avatar_url, trust_score, role, shopper_profiles(verification_status))')
      .eq('is_available', true)
      .eq('approval_status', 'approved')
      .gt('boosted_until', now)
      .order('boosted_until', { ascending: false })
      .limit(16),

    // Get recent normal products
    supabase
      .from('products')
      .select('*, product_images(*), profiles:shopper_id(id, full_name, avatar_url, trust_score, role, shopper_profiles(verification_status))')
      .eq('is_available', true)
      .eq('approval_status', 'approved')
      .or(`boosted_until.lt.${now},boosted_until.is.null`)
      .order('created_at', { ascending: false })
      .limit(16),
  ])

  // Geo-targeting
  const location = await getUserLocation();

  // Fetch geo banners + shipping promos
  let bannerQuery = supabase
    .from('promotions')
    .select('*')
    .in('type', ['banner', 'shipping'])
    .eq('is_active', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (location.country) {
    bannerQuery = bannerQuery.or(`target_country.eq.${location.country},target_country.is.null`)
  } else {
    bannerQuery = bannerQuery.is('target_country', null)
  }
  const { data: banners } = await bannerQuery.limit(3);

  // Fetch flash sale campaign
  let flashCampaignQuery = supabase
    .from('promotions')
    .select('*')
    .eq('type', 'flash_sale_campaign')
    .eq('is_active', true)
    .eq('status', 'active');
  
  if (location.country) {
    flashCampaignQuery = flashCampaignQuery.or(`target_country.eq.${location.country},target_country.is.null`)
  } else {
    flashCampaignQuery = flashCampaignQuery.is('target_country', null)
  }
  
  const { data: flashCampaigns } = await flashCampaignQuery.limit(1);
  const flashCampaign = flashCampaigns?.[0] || null;

  let flashSaleItems: Awaited<ReturnType<typeof fetchApprovedCampaignProducts>> = []
  if (flashCampaign) {
    flashSaleItems = await fetchApprovedCampaignProducts(supabase, flashCampaign.id)
  }

  // Combine boosts and recent products
  const combinedProducts = [...(activeBoosts ?? []), ...(recentProducts ?? [])]

  // Show all products regardless of verification status
  const verifiedProducts = combinedProducts

  const allProducts =
    verifiedProducts.length > 0
      ? (verifiedProducts as unknown as ProductWithDetails[])
      : (MOCK_PRODUCTS as unknown as ProductWithDetails[])

  const trendingProducts = allProducts.slice(0, 12)

  const hasFlashSaleProducts = flashSaleItems.length > 0

  return (
    <main className="flex-1 bg-slate-50 pb-20">
      <OrganizationJsonLd />

      {/* ── 0. GEO BANNERS ─────────────────────────────────────────────── */}
      {(banners && banners.length > 0) && (
        <section className="px-3 sm:px-4 pt-4 max-w-[1400px] mx-auto">
          <GeoPromoBanner promotions={banners as any} />
        </section>
      )}

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

      {/* ── 3. FLASH DEALS (active campaign; carousel when products approved) ─ */}
      {flashCampaign && hasFlashSaleProducts && (
        <FlashSaleCarousel campaign={flashCampaign as any} items={flashSaleItems as any} />
      )}
      {flashCampaign && !hasFlashSaleProducts && (
        <FlashSaleTeaser campaign={flashCampaign as any} />
      )}

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
