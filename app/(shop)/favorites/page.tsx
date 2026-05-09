import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HomeProductCard } from '@/components/products/HomeProductCard'
import type { ProductWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'My Favorites | KelalShop',
}

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/favorites')
  }

  // Fetch wishlisted items
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('*, products(*, product_images(*), profiles:shopper_id(*), shopper_profiles:shopper_id(verification_status))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const favoriteProducts = wishlists
    ?.map((w) => w.products)
    .filter((p) => p !== null) as ProductWithDetails[]

  return (
    <main className="flex-1 bg-slate-50 py-10 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
            <svg className="w-8 h-8 text-amber-500 fill-amber-500" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            My Favorites
          </h1>
          <p className="text-slate-500 mt-2">
            Items you've liked and saved for later.
          </p>
        </div>

        {/* Products Grid */}
        {!favoriteProducts || favoriteProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm py-20 px-6 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">No favorites yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              Tap the heart icon on any product to save it here.
            </p>
            <Link
              href="/products"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold rounded-xl transition-colors shadow-sm"
            >
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {favoriteProducts.map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
      </div>
    </main>
  )
}
