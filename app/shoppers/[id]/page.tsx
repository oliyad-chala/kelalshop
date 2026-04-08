import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/products/ProductCard'
import { ShopperBadge } from '@/components/shoppers/ShopperBadge'
import { getRatingStars, formatRating } from '@/lib/utils/formatters'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('full_name').eq('id', id).single()
  return { title: data?.full_name ? `${data.full_name} | Shopper Profile` : 'Shopper Not Found' }
}

export default async function ShopperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Verify it's a shopper
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, shopper_profiles(*, shopper_categories(categories(*)), shopper_sources(sources(*)))')
    .eq('id', id)
    .single()

  if (!profile || profile.role !== 'shopper') {
    notFound()
  }

  const shopperData = profile.shopper_profiles[0]
  if (!shopperData) notFound()

  // Fetch shopper's products
  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(*), categories(*), profiles:shopper_id(*), shopper_profiles:shopper_id(verification_status)')
    .eq('shopper_id', id)
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  return (
    <main className="flex-1 bg-slate-50 min-h-screen pb-20">
      {/* Header Profile Section */}
      <div className="bg-navy-950 text-white pt-20 pb-24 px-4 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
         <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
            <Avatar 
               src={profile.avatar_url} 
               name={profile.full_name} 
               size="xl" 
               className="w-32 h-32 md:w-40 md:h-40 ring-4 ring-navy-900 border-4 border-white shadow-2xl bg-white text-navy-900" 
            />
            <div className="flex-1 text-center md:text-left">
               <div className="flex flex-col md:flex-row items-center gap-3 mb-2 justify-center md:justify-start">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{profile.full_name}</h1>
                  <ShopperBadge status={shopperData.verification_status} className="mt-1" />
               </div>
               
               {shopperData.business_name && (
                  <p className="text-amber-400 font-medium text-lg mb-2">{shopperData.business_name}</p>
               )}
               
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-navy-200">
                  {profile.location && (
                     <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {profile.location}
                     </span>
                  )}
                  <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                     <span className="text-amber-500">{getRatingStars(shopperData.trust_score)}</span>
                     {shopperData.trust_score > 0 ? formatRating(shopperData.trust_score) : 'No reviews yet'}
                  </span>
                  <span>•</span>
                  <span>{shopperData.total_orders} Orders</span>
               </div>
            </div>
            <div className="shrink-0 flex gap-3 w-full md:w-auto mt-4 md:mt-0">
               <Button size="lg" className="w-full md:w-auto bg-white text-navy-900 hover:bg-slate-100">
                  Message
               </Button>
            </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
         <div className="grid md:grid-cols-3 gap-8">
            
            {/* Sidebar Details */}
            <div className="space-y-6">
               <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="font-semibold text-navy-900 mb-4 text-sm uppercase tracking-wider">About</h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-6">
                     {shopperData.bio || 'This shopper has not provided a biography yet.'}
                  </p>
                  
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                     <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Import Categories</h4>
                        <div className="flex flex-wrap gap-2">
                           {shopperData.shopper_categories?.map((cat: any) => (
                              <Badge key={cat.categories.id} variant="default" className="text-xs bg-slate-100 text-slate-700 font-medium">
                                 {cat.categories.name}
                              </Badge>
                           ))}
                           {(!shopperData.shopper_categories || shopperData.shopper_categories.length === 0) && (
                              <span className="text-sm text-slate-400 italic">None specified</span>
                           )}
                        </div>
                     </div>
                     <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Main Sources</h4>
                        <div className="flex flex-wrap gap-2">
                           {shopperData.shopper_sources?.map((s: any) => (
                              <Badge key={s.sources.id} variant="default" className="text-xs font-medium border border-slate-200 bg-white shadow-sm">
                                 {s.sources.name}
                              </Badge>
                           ))}
                           {(!shopperData.shopper_sources || shopperData.shopper_sources.length === 0) && (
                              <span className="text-sm text-slate-400 italic">None specified</span>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Main Content -> Listings & Reviews */}
            <div className="md:col-span-2 space-y-8 pt-10 md:pt-0">
               <div>
                  <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                     Current Listings
                     <Badge className="bg-amber-100 text-amber-700">{products?.length || 0}</Badge>
                  </h2>
                  
                  {!products || products.length === 0 ? (
                     <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl">
                        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-slate-500 font-medium">No available products right now.</p>
                     </div>
                  ) : (
                     <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {products.map(product => (
                           <ProductCard key={product.id} product={product as any} />
                        ))}
                     </div>
                  )}
               </div>
            </div>

         </div>
      </div>
    </main>
  )
}
