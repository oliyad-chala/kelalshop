import { ProductCardSkeleton } from '@/components/ui/Skeleton'

export default function ProductsLoading() {
  return (
    <main className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 w-full bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Filter Sidebar Skeleton */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 h-[600px] animate-pulse">
            <div className="h-6 bg-slate-100 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-slate-50 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content Area Skeleton */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Top Bar Skeleton */}
          <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 h-[68px] animate-pulse"></div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(12)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
