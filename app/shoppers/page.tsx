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
    .select('*, shopper_profiles(*, shopper_categories(categories(*)), shopper_sources(sources(*)))')
    .eq('role', 'shopper')
    .order('trust_score', { ascending: false })

  const shoppers = profiles as ShopperWithProfile[] | null

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl font-bold text-navy-900 tracking-tight mb-4">Verified Shoppers</h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Connect with trusted local importers. Review their profiles, check their categories of expertise, and see their trust scores before making a request.
        </p>
      </div>

      {!shoppers || shoppers.length === 0 ? (
         <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
            <h3 className="text-lg font-medium text-navy-900 mb-1">No shoppers found</h3>
            <p className="text-slate-500">Check back later for newly verified importers.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {shoppers.map(shopper => (
               <ShopperCard key={shopper.id} shopper={shopper} />
            ))}
         </div>
      )}
    </main>
  )
}
