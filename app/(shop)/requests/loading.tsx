import { RequestCardSkeleton } from '@/components/ui/Skeleton'

export default function RequestsLoading() {
  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-12 animate-pulse">
         <div className="max-w-2xl w-full">
           <div className="h-10 w-64 bg-slate-200 rounded-lg mb-4"></div>
           <div className="h-6 w-full max-w-xl bg-slate-100 rounded-lg mb-2"></div>
           <div className="h-6 w-3/4 bg-slate-100 rounded-lg"></div>
         </div>
         <div className="shrink-0 mt-2 sm:mt-0">
            <div className="h-12 w-40 bg-slate-200 rounded-xl"></div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <RequestCardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
