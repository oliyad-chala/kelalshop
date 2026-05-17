import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductsFilter } from '@/components/products/ProductsFilter'
import { ProductControls } from '@/components/products/ProductControls'
import type { ProductWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'Discover Products | KelalShop',
}

export const dynamic = 'force-dynamic'

export default async function ProductsFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min_price?: string; max_price?: string; sort?: string; view?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, product_images(*), profiles:shopper_id(*, shopper_profiles(verification_status))')
    .eq('is_available', true)
    
  if (params.q) {
     query = query.ilike('name', `%${params.q}%`)
  }
  
  if (params.category) {
     query = query.eq('category_id', params.category)
  }
  
  if (params.min_price) {
     query = query.gte('price', Number(params.min_price))
  }
  
  if (params.max_price) {
     query = query.lte('price', Number(params.max_price))
  }

  // Apply sorting
  if (params.sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (params.sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else if (params.sort === 'top_rated') {
    query = query.order('created_at', { ascending: false }) // Fallback for top rated
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: products } = await query
  const { data: categories } = await supabase.from('categories').select('*').order('name')
  const items = products && products.length > 0 ? (products as ProductWithDetails[]) : []
  const catList = categories && categories.length > 0 ? categories : [
     { id: 'mock-1', name: 'Electronics' },
     { id: 'mock-2', name: 'Clothes & Fashion' },
     { id: 'mock-3', name: 'Home & Living' },
     { id: 'mock-4', name: 'Vehicles' }
  ]

  return (
    <main className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 w-full bg-slate-50 min-h-screen">
      
      <div className="flex flex-col lg:flex-row gap-6 items-start">
         
         <ProductsFilter categories={catList} params={params} />
         
         {/* MAIN CONTENT AREA */}
         <div className="flex-1 w-full flex flex-col gap-6">
            
            {/* Top Navigation / Sorting Bar - Simplified */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100">
               
               <div className="text-sm font-medium text-slate-500 w-full sm:w-auto text-center sm:text-left mb-4 sm:mb-0">
                  Showing <span className="font-bold text-navy-900">{items?.length || 0}</span> products
               </div>
               
               <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  
                  {/* MOBILE FILTER BUTTON */}
                  <label 
                     htmlFor="mobile-filter-toggle" 
                     className="lg:hidden flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-navy-900 text-sm font-bold rounded-lg px-3 py-2 cursor-pointer hover:border-slate-300 hover:bg-slate-100 transition-colors"
                  >
                     <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                     </svg>
                     Filter
                  </label>

                  <ProductControls currentSort={params.sort} currentView={params.view} />
               </div>
            </div>

            {/* Product Grid */}
            {!items || items.length === 0 ? (
              <div className="text-center py-32 bg-white border border-slate-100 rounded-2xl shadow-sm">
                 <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                 <h3 className="text-xl font-bold text-navy-900 mb-2">No products found</h3>
                 <p className="text-slate-500">We couldn't find anything matching your search or filter.</p>
              </div>
            ) : (
              <div className={params.view === 'list' ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"}>
                 {items.map(product => (
                    <ProductCard key={product.id} product={product} view={params.view as 'grid' | 'list' | undefined} />
                 ))}
              </div>
            )}
         </div>
      </div>
    </main>
  )
}
