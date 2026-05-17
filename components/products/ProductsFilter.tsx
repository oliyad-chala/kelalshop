'use client'

interface Category {
  id: string
  name: string
}

interface ProductsFilterProps {
  categories: Category[]
  params: {
    q?: string
    category?: string
    min_price?: string
    max_price?: string
  }
}

export function ProductsFilter({ categories, params }: ProductsFilterProps) {
  const FilterContent = () => (
    <>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 hidden lg:flex">
        <h2 className="text-lg font-bold text-navy-900 tracking-tight">Filter</h2>
        <a href="/products" className="text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors">
          Clear all
        </a>
      </div>
      
      {/* Mobile Clear All */}
      <div className="lg:hidden mb-4 pb-4 border-b border-slate-100">
        <a href="/products" className="block w-full text-center py-2 bg-slate-50 rounded-lg text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors">
          Clear all filters
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
        <ul className="space-y-3 overflow-y-auto scrollbar-hide pr-2" style={{ maxHeight: 'calc(100vh - 350px)' }}>
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
          {categories?.map((cat) => (
            <li key={cat.id}>
              <a 
                href={`/products?category=${cat.id}${params.q ? `q=${params.q}` : ''}${params.min_price ? `&min_price=${params.min_price}` : ''}${params.max_price ? `&max_price=${params.max_price}` : ''}`} 
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
          {(!categories || categories.length === 0) && (
            <li className="text-sm text-slate-400 p-2">No categories found</li>
          )}
        </ul>
      </div>
    </>
  )

  return (
    <>
      <input type="checkbox" id="mobile-filter-toggle" className="peer hidden" />

      {/* Desktop Sidebar Filter (Hidden on small screens) */}
      <div className="hidden lg:block w-[260px] shrink-0 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
          <FilterContent />
        </div>
      </div>

      {/* Mobile Overlay & Drawer (Visible when checkbox is checked on small screens) */}
      <div className="fixed inset-0 z-[100] hidden peer-checked:flex justify-end lg:hidden">
        {/* Backdrop */}
        <label 
          htmlFor="mobile-filter-toggle"
          className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm cursor-pointer"
        />
        
        {/* Drawer Panel */}
        <div className="relative w-[300px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
            <span className="font-bold text-navy-900 text-lg">Filters</span>
            <label 
              htmlFor="mobile-filter-toggle"
              className="p-2 -mr-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </label>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <FilterContent />
          </div>
        </div>
      </div>
    </>
  )
}
