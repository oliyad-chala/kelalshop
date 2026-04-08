import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import { Input } from '@/components/ui/Input'
import type { ProductWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'Products | KelalShop',
}

export default async function ProductsFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, product_images(*), categories(*), profiles:shopper_id(*), shopper_profiles:shopper_id(verification_status)')
    .eq('is_available', true)
    
  if (params.q) {
     query = query.ilike('name', `%${params.q}%`)
  }
  
  if (params.category) {
     query = query.eq('category_id', params.category)
  }

  const { data: products } = await query.order('created_at', { ascending: false })
  const { data: categories } = await supabase.from('categories').select('*').order('name')

  const items = products as ProductWithDetails[] | null

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 tracking-tight mb-2">Marketplace</h1>
          <p className="text-slate-500">Discover items listed by local verified shoppers.</p>
        </div>
        
        {/* Simple Search Form (Server component uses action implicitly in full version, here we use standard form GET) */}
        <form action="/products" className="w-full md:w-auto flex gap-2">
           <div className="w-full md:w-72">
             <Input 
                name="q" 
                defaultValue={params.q} 
                placeholder="Search products..." 
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
             />
           </div>
           {params.category && <input type="hidden" name="category" value={params.category} />}
           <button type="submit" className="hidden">Search</button>
        </form>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
         {/* Sidebar filters */}
         <div className="w-full md:w-64 shrink-0 space-y-6">
            <div>
               <h3 className="font-semibold text-navy-900 mb-3">Categories</h3>
               <ul className="space-y-1.5">
                  <li>
                     <a href="/products" className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!params.category ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                        All Categories
                     </a>
                  </li>
                  {categories?.map((cat) => (
                     <li key={cat.id}>
                        <a 
                           href={`/products?category=${cat.id}${params.q ? `&q=${params.q}` : ''}`} 
                           className={`block px-3 py-2 rounded-lg text-sm transition-colors ${params.category === cat.id ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                           {cat.name}
                        </a>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
         
         {/* Grid */}
         <div className="flex-1 w-full">
            {!items || items.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
                 <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                 <h3 className="text-lg font-medium text-navy-900 mb-1">No products found</h3>
                 <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
