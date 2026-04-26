import { createClient } from '@/lib/supabase/server'
import { ShopperCard } from '@/components/shoppers/ShopperCard'
import type { ShopperWithProfile } from '@/types/app.types'

export const metadata = {
  title: 'Find Shoppers | KelalShop',
}

const MOCK_SHOPPERS = [
  {
    id: 's1',
    full_name: 'Dawit Tadesse',
    avatar_url: null,
    trust_score: 95,
    role: 'shopper',
    location: 'Addis Ababa',
    shopper_profiles: {
      bio: 'Fastest delivery from AliExpress and Amazon. I handle all customs and provide door-step delivery in Addis.',
      verification_status: 'verified',
      total_orders: 142,
      shopper_categories: [
        { categories: { id: 'c1', name: 'Electronics' } },
        { categories: { id: 'c2', name: 'Office & Tech' } }
      ],
      shopper_sources: []
    }
  },
  {
    id: 's2',
    full_name: 'Sara Mengistu',
    avatar_url: null,
    trust_score: 88,
    role: 'shopper',
    location: 'Dire Dawa',
    shopper_profiles: {
      bio: 'Fashion and Beauty imports form Shein. Specialized in bulk cosmetics and trending apparel.',
      verification_status: 'approved',
      total_orders: 56,
      shopper_categories: [
        { categories: { id: 'c3', name: 'Fashion & Beauty' } },
        { categories: { id: 'c4', name: 'Baby & Kids' } }
      ],
      shopper_sources: []
    }
  },
  {
    id: 's3',
    full_name: 'Elias Bekele',
    avatar_url: null,
    trust_score: 100,
    role: 'shopper',
    location: 'Addis Ababa',
    shopper_profiles: {
      bio: 'Vehicle spare parts and heavy machinery components. Guaranteed quality with competitive pricing.',
      verification_status: 'verified',
      total_orders: 89,
      shopper_categories: [
        { categories: { id: 'c5', name: 'Vehicles' } },
        { categories: { id: 'c6', name: 'Wholesale' } }
      ],
      shopper_sources: []
    }
  }
]

export default async function ShoppersFeedPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, shopper_profiles(*, shopper_categories(categories(*)), shopper_sources(sources(*)))')
    .eq('role', 'shopper')
    .order('trust_score', { ascending: false })

  const shoppers = profiles && profiles.length > 0 ? (profiles as ShopperWithProfile[]) : (MOCK_SHOPPERS as unknown as ShopperWithProfile[])

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {shoppers.map(shopper => (
            <ShopperCard key={shopper.id} shopper={shopper} />
         ))}
      </div>
    </main>
  )
}
