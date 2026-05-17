import { ShopperCardSkeleton } from '@/components/ui/Skeleton'

export default function ShoppersLoading() {
  return (
    <main className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 py-12 w-full bg-slate-50 min-h-screen">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 animate-pulse">
        <div className="h-6 w-32 bg-amber-100 rounded-full mb-3"></div>
        <div className="h-12 w-3/4 bg-slate-200 rounded-lg mb-6"></div>
        <div className="h-6 w-full bg-slate-100 rounded-lg max-w-2xl"></div>
        <div className="h-6 w-5/6 bg-slate-100 rounded-lg max-w-2xl mt-2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <ShopperCardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
