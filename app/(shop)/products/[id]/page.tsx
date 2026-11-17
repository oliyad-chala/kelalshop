import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Phone } from 'lucide-react'
import { formatPrice, getRatingStars, formatRating, isPriceOnCall } from '@/lib/utils/formatters'
import { ShopperBadge } from '@/components/shoppers/ShopperBadge'
import { BuyButton } from './BuyButton'
import { MOCK_PRODUCTS } from '@/lib/constants/mock-data'
import { ProductGallery } from '@/components/products/ProductGallery'
import { HomeProductCard } from '@/components/products/HomeProductCard'
import { ProductShareBar } from '@/components/products/ProductShareBar'
import { trackProductView } from '@/lib/actions/tracking'
import type { ProductWithDetails } from '@/types/app.types'
import { getActiveCampaignOffer, resolveDisplayPrice } from '@/lib/utils/campaign-pricing'
import { ProductJsonLd } from '@/components/seo/ProductJsonLd'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id.startsWith('mock')) {
    const mockProd = MOCK_PRODUCTS.find((p) => p.id === id)
    if (!mockProd) return { title: 'Product Not Found | KelalShop' }
    return {
      title: `${mockProd.name} | KelalShop`,
      description: mockProd.description || `Buy ${mockProd.name} on KelalShop (ቀላል ሾፕ) in Ethiopian Birr (ETB).`,
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('name, description, product_images(url)')
    .eq('id', id)
    .single()

  const product = data as any
  if (!product) return { title: 'Product Not Found | KelalShop' }

  const desc = product.description
    ? (product.description.length > 155 ? product.description.substring(0, 152) + '...' : product.description)
    : `Buy ${product.name} on KelalShop (ቀላል ሾፕ) with local CBE/Telebirr payment.`

  const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.url || product.product_images?.[0]?.url

  return {
    title: `${product.name} | KelalShop`,
    description: desc,
    openGraph: {
      title: `${product.name} | KelalShop`,
      description: desc,
      images: primaryImage ? [{ url: primaryImage }] : [],
    }
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let product: any = null
  let relatedProducts: any[] = []
  let isStrictCategoryMatch = false

  if (id.startsWith('mock')) {
    // ── Handle Mock Product ──
    const foundMock = MOCK_PRODUCTS.find((p) => p.id === id)
    if (!foundMock) notFound()
    product = foundMock
    // Find related mock products (excluding current one, strictly from same category if any exist)
    const sameCatMocks = MOCK_PRODUCTS.filter(p => p.id !== id && p.categories?.id === foundMock.categories?.id).slice(0, 5)
    if (sameCatMocks.length > 0) {
      relatedProducts = sameCatMocks
      isStrictCategoryMatch = true
    } else {
      relatedProducts = MOCK_PRODUCTS.filter(p => p.id !== id).slice(0, 5)
      isStrictCategoryMatch = false
    }
  } else {
    // ── Handle Real DB Product ──
    const admin = createAdminClient()
    const { data: productResult } = await admin
      .from('products')
      .select('*, product_images(*), categories(*), profiles:shopper_id(*), shopper_profiles:shopper_id(*)')
      .eq('id', id)
      .single()

    if (!productResult) notFound()
    product = productResult

    // If product is not approved, only the owner or an admin should see it.
    if (product.approval_status !== 'approved') {
      if (!user) {
        notFound()
      } else if (user.id !== product.shopper_id) {
        // Check if the user is an admin
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (currentUserProfile?.role !== 'admin') {
          notFound()
        }
      }
    }

    // Track view asynchronously
    if (user) {
      trackProductView(product.id)
    }

    // 1. Strict category matching: only items from the same category qualify as "Similar Products"
    if (product.category_id) {
      const { data: sameCatData } = await admin
        .from('products')
        .select('*, product_images(*), categories(*), profiles:shopper_id(*, shopper_profiles(verification_status))')
        .eq('category_id', product.category_id)
        .eq('is_available', true)
        .eq('approval_status', 'approved')
        .neq('id', product.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (sameCatData && sameCatData.length > 0) {
        relatedProducts = sameCatData
        isStrictCategoryMatch = true
      }
    }

    // 2. Exploration fallback: if no other items exist in this category, don't mislabel unrelated items as "similar".
    // Instead show recent available marketplace items under "More to Explore".
    if (relatedProducts.length === 0) {
      const { data: exploreData } = await admin
        .from('products')
        .select('*, product_images(*), categories(*), profiles:shopper_id(*, shopper_profiles(verification_status))')
        .eq('is_available', true)
        .eq('approval_status', 'approved')
        .neq('id', product.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (exploreData && exploreData.length > 0) {
        relatedProducts = exploreData
        isStrictCategoryMatch = false
      }
    }
  }

  const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.url || product.product_images?.[0]?.url || null

  let resolvedPrice = {
    price: Number(product.price),
    originalPrice: Number(product.price),
    discountPct: 0,
    onSale: false,
  }

  if (!id.startsWith('mock')) {
    const basePrice = Number(product.price)
    const offer = await getActiveCampaignOffer(supabase, product.id, basePrice)
    const display = resolveDisplayPrice(basePrice, offer)
    resolvedPrice = {
      price: display.price,
      originalPrice: display.originalPrice,
      discountPct: display.discountPct,
      onSale: display.onSale,
    }
  }

  return (
    <main className="flex-1 bg-slate-50 py-8 md:py-12">
      <ProductJsonLd
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: resolvedPrice.price,
          image_url: primaryImage,
        }}
      />
      {/* Reduced max-width from 7xl to 5xl for a more compact UI */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 md:mb-8 w-full overflow-x-auto pb-2">
           <Link href="/" className="hover:text-navy-900 shrink-0">Home</Link>
           <span className="shrink-0">/</span>
           <Link href="/products" className="hover:text-navy-900 shrink-0">Products</Link>
           {product.categories && (
             <>
               <span className="shrink-0">/</span>
               <Link href={`/products?category=${product.categories.id || product.category_id}`} className="hover:text-navy-900 shrink-0">
                 {product.categories.name}
               </Link>
             </>
           )}
           <span className="shrink-0">/</span>
           <span className="text-navy-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row mb-12">
          
          {/* Photos Area (Gallery) */}
          <div className="w-full md:w-[55%] p-4 sm:p-6 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
             <ProductGallery
               images={product.product_images || []}
               productName={product.name}
               isSold={product.is_available === false}
             />
          </div>

          {/* Details Area */}
          <div className="w-full md:w-[45%] p-6 sm:p-8 flex flex-col bg-white">
            <div className="flex flex-col gap-2.5 items-start mb-5">
              <Badge variant={product.is_available ? 'success' : 'danger'}>
                 {product.is_available ? 'In Stock' : 'Out of Stock'}
              </Badge>
              <h1 className="text-xl sm:text-2xl font-bold text-navy-900 leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="mb-6 border-b border-slate-100 pb-6">
              {isPriceOnCall(product) ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                  <Phone className="w-5 h-5 text-amber-500" />
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-600 tracking-tight">Price on Call</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-2xl font-bold text-amber-600">
                    {formatPrice(resolvedPrice.price)}
                  </span>
                  {resolvedPrice.onSale && (
                    <>
                      <span className="text-lg text-slate-400 line-through">
                        {formatPrice(resolvedPrice.originalPrice)}
                      </span>
                      <span className="text-sm font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        -{resolvedPrice.discountPct}% Flash Sale
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="prose prose-sm text-slate-600 mb-6 flex-1 text-sm">
              <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>
            
            {/* Dynamic Attributes / Specifications */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="mb-6 bg-slate-50 rounded-2xl border border-slate-100 p-5">
                <h3 className="text-sm font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Specifications
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="flex flex-col border-b border-slate-200/60 pb-2">
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{key}</dt>
                      <dd className="text-sm font-medium text-navy-900">{value as string}</dd>
                    </div>
                  ))}
                  {product.location && (
                    <div className="flex flex-col border-b border-slate-200/60 pb-2">
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</dt>
                      <dd className="text-sm font-medium text-navy-900">{product.location}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
            {/* Fallback to just location if no attributes exist but location does */}
            {(!product.attributes || Object.keys(product.attributes).length === 0) && product.location && (
              <div className="mb-6 bg-slate-50 rounded-2xl border border-slate-100 p-5">
                 <dl className="grid grid-cols-1">
                    <div className="flex flex-col">
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Location</dt>
                      <dd className="text-sm font-medium text-navy-900 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {product.location}
                      </dd>
                    </div>
                 </dl>
              </div>
            )}
            
            {/* Shopper Card Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Imported By</h4>
               <Link href={`/shoppers/${product.shopper_id || 'mock'}`} className="flex items-center gap-3 group">
                  <Avatar src={product.profiles?.avatar_url} name={product.profiles?.full_name || 'Shopper'} size="md" />
                  <div className="flex-1">
                     <div className="text-sm font-bold text-navy-900 group-hover:text-amber-600 transition-colors">
                        {product.profiles?.full_name || 'Verified Shopper'}
                     </div>
                     <div className="flex items-center gap-2 mt-0.5">
                        <ShopperBadge status={product.shopper_profiles?.verification_status || 'unverified'} showText={false} />
                        {(product.profiles?.trust_score > 0 || product.shopper_profiles?.trust_score > 0) && (
                          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                            {getRatingStars(product.profiles?.trust_score || product.shopper_profiles?.trust_score)} 
                            {formatRating(product.profiles?.trust_score || product.shopper_profiles?.trust_score)}
                          </span>
                        )}
                     </div>
                  </div>
               </Link>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              {/* Client Component for cart/buy actions */}
              <BuyButton 
                product={{
                  id: product.id,
                  name: product.name,
                  price: resolvedPrice.price,
                  stock: product.stock ?? 99,
                  is_available: product.is_available,
                  image: primaryImage,
                  shopperName: product.profiles?.full_name || 'Shopper',
                  shopperId: product.shopper_id || 'mock',
                  isOnCall: isPriceOnCall(product),
                  attributes: product.attributes,
                }}
                seller={{
                  id: product.shopper_id || 'mock',
                  name: product.profiles?.full_name || 'Verified Shopper',
                  phone: product.profiles?.phone || null,
                  avatarUrl: product.profiles?.avatar_url || null,
                  location: product.location || product.profiles?.location || null,
                  verificationStatus: product.shopper_profiles?.verification_status || 'verified',
                }}
                currentUserId={user?.id}
              />

              <Link
                href={user
                  ? `/dashboard/chat/dm/${product.shopper_id}`
                  : `/auth/login?redirectTo=${encodeURIComponent(`/products/${product.id}`)}`}
                className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-navy-900 hover:border-amber-400 hover:text-amber-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Message Shopper
              </Link>

              <ProductShareBar productName={product.name} productId={product.id} />
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
              <div>
                <h2 className="text-xl font-bold text-navy-900">
                  {isStrictCategoryMatch
                    ? `Similar in ${product.categories?.name || 'this Category'}`
                    : 'More to Explore on KelalShop'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {isStrictCategoryMatch
                    ? `Other available items in ${product.categories?.name || 'this category'} curated by verified shoppers`
                    : 'Discover other popular items and recent arrivals across our marketplace'}
                </p>
              </div>
              <Link
                href={
                  isStrictCategoryMatch
                    ? `/products?category=${product.categories?.id || product.category_id}`
                    : '/products'
                }
                className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors inline-flex items-center gap-1 shrink-0"
              >
                {isStrictCategoryMatch ? 'View Category' : 'Browse All'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {relatedProducts.map((p) => (
                <HomeProductCard key={p.id} product={p as unknown as ProductWithDetails} />
              ))}
            </div>

            {/* Custom Sourcing Request prompt when no other items in category */}
            {!isStrictCategoryMatch && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white p-5">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-navy-900">
                      Looking for more {product.categories?.name ? product.categories.name.toLowerCase() : 'specific'} products?
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                      Can&apos;t find the exact gear or item you need? Post a custom sourcing request and our verified global shoppers will import it for you from AliExpress, Amazon, or Shein.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/requests/new?category=${encodeURIComponent(product.categories?.name || '')}`}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-colors"
                >
                  Request Custom Item
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
