import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import type { ProductWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'Discover Products | KelalShop',
}

export const dynamic = 'force-dynamic'

export default async function ProductsFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min_price?: string; max_price?: string }>
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

  const { data: products } = await query.order('created_at', { ascending: false })
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
         
         {/* LEFT SIDEBAR FILTER - Simplified Standard Layout */}
         <div className="w-full lg:w-[260px] shrink-0 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
               
               {/* Filter Header */}
               <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-navy-900 tracking-tight">Filter</h2>
                  <a href="/products" className="text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors">
                     Clear all
                  </a>
               </div>

               {/* Standard Price Filter (Inputs) */}
               <form action="/products" method="GET" className="mb-8 pb-8 border-b border-slate-100">
                  {params.q && <input type="hidden" name="q" value={params.q} />}
                  {params.category && <input type="hidden" name="category" value={params.category} />}
                  
                  <h3 className="font-bold text-navy-900 mb-4">Price Range (Br)</h3>
                  <div className="flex items-center gap-2 mb-4">
                     <input 
                        type="number" 
                        name="min_price" 
                        defaultValue={params.min_price}
                        placeholder="Min" 
                        min="0"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-navy-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                     />
                     <span className="text-slate-400">-</span>
                     <input 
                        type="number" 
                        name="max_price" 
                        defaultValue={params.max_price}
                        placeholder="Max" 
                        min="0"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-navy-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                     />
                  </div>
                  <button type="submit" className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-sm">
                     Apply Price
                  </button>
               </form>

               {/* Standard Categories Filter (List) */}
               <div>
                  <h3 className="font-bold text-navy-900 mb-4 flex items-center justify-between">
                     Categories
                     {params.category && (
                        <a href="/products" className="text-xs font-medium text-slate-400 hover:text-red-500">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </a>
                     )}
                  </h3>
                  <ul className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
                     <li>
                        <a 
                           href={`/products?${params.q ? `q=${params.q}` : ''}${params.min_price ? `&min_price=${params.min_price}` : ''}${params.max_price ? `&max_price=${params.max_price}` : ''}`} 
                           className="flex items-center gap-3 group"
                        >
                           <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${!params.category ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 bg-white group-hover:border-amber-500'}`}>
                              {!params.category && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                           </div>
                           <span className={`text-sm ${!params.category ? 'font-bold text-navy-900' : 'text-slate-600 group-hover:text-navy-900'}`}>
                              All Categories
                           </span>
                        </a>
                     </li>
                     {catList?.map((cat) => (
                        <li key={cat.id}>
                           <a 
                              href={`/products?category=${cat.id}${params.q ? `&q=${params.q}` : ''}${params.min_price ? `&min_price=${params.min_price}` : ''}${params.max_price ? `&max_price=${params.max_price}` : ''}`} 
                              className="flex items-center gap-3 group"
                           >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${params.category === cat.id ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 bg-white group-hover:border-amber-500'}`}>
                                 {params.category === cat.id && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className={`text-sm ${params.category === cat.id ? 'font-bold text-navy-900' : 'text-slate-600 group-hover:text-navy-900'}`}>
                                 {cat.name}
                              </span>
                           </a>
                        </li>
                     ))}
                     {(!catList || catList.length === 0) && (
                        <li className="text-sm text-slate-400 p-2">No categories found</li>
                     )}
                  </ul>
               </div>
            </div>
         </div>
         
         {/* MAIN CONTENT AREA */}
         <div className="flex-1 w-full flex flex-col gap-6">
            
            {/* Top Navigation / Sorting Bar - Simplified */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100">
               
               <div className="text-sm font-medium text-slate-500 w-full sm:w-auto text-center sm:text-left mb-4 sm:mb-0">
                  Showing <span className="font-bold text-navy-900">{items?.length || 0}</span> products
               </div>
               
               <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
                  <div className="relative">
                     <select className="appearance-none bg-slate-50 border border-slate-200 text-navy-900 text-sm font-medium rounded-lg pl-4 pr-10 py-2 outline-none hover:border-slate-300 transition-colors focus:ring-1 focus:ring-amber-500 cursor-pointer">
                        <option>Newest First</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Top Rated</option>
                     </select>
                     <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                     </div>
                  </div>

                  <div className="flex items-center p-1 bg-slate-50 rounded-lg border border-slate-200">
                     <button className="p-1.5 bg-white text-navy-900 rounded shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                     </button>
                     <button className="p-1.5 text-slate-400 hover:text-navy-900 rounded transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                     </button>
                  </div>
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
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                 {items.map(product => (
                    <ProductCard key={product.id} product={product} />
                 ))}
              </div>
            )}
         </div>
      </div>
    </main>
  )
}
