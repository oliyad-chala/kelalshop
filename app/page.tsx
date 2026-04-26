import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils/formatters'
import type { ProductWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'KelalShop — Ethiopian Marketplace',
}

const CATEGORIES = [
  { name: 'Home & Living', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>, color: 'bg-orange-100 text-orange-600' },
  { name: 'Baby & Kids', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, color: 'bg-blue-100 text-blue-600' },
  { name: 'Electronics', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Office & Tech', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>, color: 'bg-amber-100 text-amber-600' },
  { name: 'Fashion & Beauty', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>, color: 'bg-rose-100 text-rose-600' },
  { name: 'Vehicles', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>, color: 'bg-slate-200 text-slate-700' },
  { name: 'Wholesale', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>, color: 'bg-purple-100 text-purple-600' },
]

const MOCK_PRODUCTS = [
  {
    id: 'mock1',
    name: 'Apple AirPods Pro (2nd Generation) Wireless Earbuds',
    price: 18500,
    stock: 12,
    is_available: true,
    product_images: [],
    profiles: { full_name: 'Dawit Tadesse', trust_score: 95 },
    shopper_profiles: { verification_status: 'verified' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock2',
    name: 'Samsung 55-inch 4K Smart UHD TV',
    price: 65000,
    stock: 3,
    is_available: true,
    product_images: [],
    profiles: { full_name: 'Sara Mengistu', trust_score: 88 },
    shopper_profiles: { verification_status: 'unverified' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock3',
    name: 'Nike Air Force 1 \'07 White Sneakers',
    price: 8200,
    stock: 25,
    is_available: true,
    product_images: [],
    profiles: { full_name: 'Dawit Tadesse', trust_score: 95 },
    shopper_profiles: { verification_status: 'verified' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock4',
    name: 'MacBook Air M2 256GB Midnight',
    price: 115000,
    stock: 1,
    is_available: true,
    product_images: [],
    profiles: { full_name: 'Helen Bekele', trust_score: 100 },
    shopper_profiles: { verification_status: 'verified' },
    created_at: new Date().toISOString(),
  }
]

export default async function Home() {
  const supabase = await createClient()

  // Fetch trending/recent available products
  const { data: recentProducts } = await supabase
    .from('products')
    .select('*, product_images(*), profiles:shopper_id(id, full_name, avatar_url, trust_score), shopper_profiles:shopper_id(verification_status)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(8)

  const products = recentProducts && recentProducts.length > 0 ? (recentProducts as ProductWithDetails[]) : (MOCK_PRODUCTS as unknown as ProductWithDetails[])

  return (
    <main className="flex-1 pb-20 bg-slate-50">
      {/* eCommerce Standard Hero Banner (Slider Mockup) */}
      <section className="px-4 sm:px-6 pt-4 pb-12 max-w-[1400px] mx-auto">
        <div className="relative w-full h-[280px] md:h-[350px] lg:h-[420px] rounded-2xl overflow-hidden bg-gradient-to-r from-amber-50 to-orange-100 flex shadow-sm border border-orange-200/50 group">
          
          <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col justify-center h-full w-full md:w-2/3 max-w-3xl">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-amber-700 bg-amber-200/50 rounded-full w-fit">
              GLOBAL IMPORT MADE EASY
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-navy-950 tracking-tight leading-[1.15] mb-4">
              Shop the world.<br className="hidden md:block" />
              <span className="text-amber-600">Pay locally.</span>
            </h1>
            <p className="text-slate-600 text-sm md:text-base lg:text-lg mb-8 max-w-lg leading-relaxed">
              Find exactly what you want from global giants like Alibaba and Amazon. Connect with a trusted Ethiopian importer and check out securely in ETB.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg" className="bg-navy-900 hover:bg-navy-800 text-white border-none font-bold rounded-xl px-8 shadow-md">
                  Discover Products
                </Button>
              </Link>
              <Link href="/shoppers">
                <Button size="lg" variant="outline" className="border-slate-300 text-navy-900 bg-white hover:bg-slate-50 font-bold rounded-xl px-8 shadow-sm">
                  Find an Importer
                </Button>
              </Link>
            </div>
          </div>

          {/* Banner Graphic Elements */}
          <div className="hidden md:block absolute right-0 bottom-0 top-0 w-1/3 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white opacity-40 rounded-full blur-3xl"></div>
            {/* Mocked visual of shopping bags */}
            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full text-amber-500/10 drop-shadow-xl p-10" fill="currentColor" viewBox="0 0 24 24">
               <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>

          {/* Mock Slider Controls */}
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
             <div className="w-6 h-1.5 bg-amber-500 rounded-full"></div>
             <div className="w-1.5 h-1.5 bg-white/80 rounded-full cursor-pointer hover:bg-white"></div>
             <div className="w-1.5 h-1.5 bg-white/80 rounded-full cursor-pointer hover:bg-white"></div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
        <h2 className="text-2xl font-bold text-navy-900 mb-8 tracking-tight">Popular Categories</h2>
        <div className="flex flex-wrap gap-4 sm:gap-8 justify-start sm:justify-between items-center overflow-x-auto pb-4 scrollbar-hide">
          {CATEGORIES.map((cat, i) => (
            <Link key={i} href={`/products?category=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-3 shrink-0 group">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] flex items-center justify-center text-4xl shadow-sm border border-slate-100 transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1 ${cat.color} bg-opacity-50 backdrop-blur-sm`}>
                {cat.icon}
              </div>
              <span className="text-sm font-medium text-slate-700 text-center max-w-[100px] leading-tight group-hover:text-amber-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-24">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-navy-900 mb-1 tracking-tight">Trending Products</h2>
            <p className="text-slate-500 text-sm">Best deals from verified shoppers</p>
          </div>
          <Link href="/products" className="text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1 text-sm bg-amber-50 px-3 py-1.5 rounded-full">
            View all 
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <Card key={product.id} hover padding="none" className="overflow-hidden flex flex-col group border-slate-200/60 rounded-3xl bg-white shadow-sm relative">
              
              <button className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/50 backdrop-blur-sm shadow-sm hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <Link href={`/products/${product.id}`} className="block relative aspect-[4/3] bg-slate-50 overflow-hidden">
                {product.product_images?.[0] ? (
                  <Image 
                    src={product.product_images[0].url} 
                    alt={product.name} 
                    fill 
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                    <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-50">Sample Image</span>
                  </div>
                )}
                {/* Verified Badge Overlay */}
                {product.shopper_profiles?.verification_status === 'verified' && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold text-emerald-600 flex items-center gap-1 shadow-sm border border-emerald-100">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Seller
                  </div>
                )}
              </Link>
              
              <div className="p-4 flex-1 flex flex-col">
                <Link href={`/products/${product.id}`} className="flex-1">
                  <h3 className="font-semibold text-navy-900 mb-2 line-clamp-2 text-sm sm:text-base leading-snug group-hover:text-amber-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="flex items-center justify-between mb-3 mt-1">
                  <div className="font-bold text-lg sm:text-xl text-navy-950">
                    <span className="text-xs font-semibold mr-1 text-slate-500">Br</span>
                    {formatPrice(product.price).replace(/[^0-9.,]/g, '')}
                  </div>
                  <button className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-amber-500 border border-amber-100 hover:bg-amber-500 hover:text-white transition-colors">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                </div>

                <div className="mt-auto flex flex-col gap-1.5 pt-2 border-t border-slate-50">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
                    <div className="flex items-center gap-1 text-amber-400">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{product.profiles?.trust_score ? (product.profiles.trust_score / 20).toFixed(1) : '4.8'}</span>
                    </div>
                    <span>({product.stock ? product.stock * 3 + 12 : 24} Reviews)</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works / Trust Section */}
      <section className="bg-white py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-navy-900 mb-12">Why KelalShop?</h2>
          <div className="grid sm:grid-cols-3 gap-10">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3 text-navy-900">Global Access</h3>
              <p className="text-slate-500 text-sm leading-relaxed px-4">Buy items from any foreign website. Shoppers handle the shipping and customs.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-amber-100">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3 text-navy-900">Secure Payments</h3>
              <p className="text-slate-500 text-sm leading-relaxed px-4">Pay in ETB securely. Funds are only released when you receive your item.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3 text-navy-900">Verified Shoppers</h3>
              <p className="text-slate-500 text-sm leading-relaxed px-4">Every shopper undergoes strict identity verification for your safety.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
