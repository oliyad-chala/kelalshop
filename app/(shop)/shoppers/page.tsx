import { createClient } from '@/lib/supabase/server'
import { ShopperCard } from '@/components/shoppers/ShopperCard'
import type { ShopperWithProfile } from '@/types/app.types'

export const metadata = {
  title: 'Find Shoppers | KelalShop',
}

export default async function ShoppersFeedPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, shopper_profiles!inner(*, shopper_categories(categories(*)), shopper_sources(import_sources(*)))')
    .order('trust_score', { ascending: false })

  // Filter in memory to fetch only explicitly promoted Top Shoppers
  const verifiedShoppers = (profiles || []).filter((p: any) => {
    const sp = Array.isArray(p.shopper_profiles) ? p.shopper_profiles[0] : p.shopper_profiles
    return sp?.is_top_shopper === true
  }) as ShopperWithProfile[]

  const shoppers = verifiedShoppers

  return (
    <main className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 py-12 w-full bg-slate-50 min-h-screen">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
        <span className="text-amber-500 font-bold tracking-wider text-sm uppercase mb-3 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
          KelalShop Partners
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-6">
          Meet Our Verified Shoppers
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
          Connect with trusted local importers holding stellar trust scores. Review their credentials, browse their categories of expertise, and place requests seamlessly.
        </p>
      </div>

      {shoppers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {shoppers.map(shopper => (
              <ShopperCard key={shopper.id} shopper={shopper} />
           ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
          <svg className="w-16 h-16 text-slate-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-navy-900 mb-2">No Top Shoppers Yet</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Top Shoppers are hand-picked by our administrators based on exceptional ratings and reviews. Buy from our sellers and leave a 5-star rating to help them get featured here!
          </p>
        </div>
      )}
    </main>
  )
}
