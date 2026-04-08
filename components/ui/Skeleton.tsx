import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  rounded?: string
}

export function Skeleton({ className, width, height, rounded = 'rounded-lg' }: SkeletonProps) {
  return (
    <div
      className={clsx('skeleton', rounded, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <Skeleton className="w-full" height="200px" rounded="rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="w-6 h-6" rounded="rounded-full" />
          <Skeleton className="h-4 w-24 mt-1" />
        </div>
      </div>
    </div>
  )
}

export function ShopperCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-14 h-14" rounded="rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}
