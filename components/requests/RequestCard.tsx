import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, getRequestStatusColor, formatPrice } from '@/lib/utils/formatters'
import type { RequestWithDetails } from '@/types/app.types'

interface RequestCardProps {
  request: RequestWithDetails
  view?: 'buyer' | 'shopper'
}

export function RequestCard({ request, view = 'shopper' }: RequestCardProps) {
  const isShopperView = view === 'shopper'

  return (
    <Link href={`/requests/${request.id}`} className="block">
      <Card hover padding="none" className="h-full border-slate-200">
        <div className="p-5 flex flex-col h-full gap-4">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant={getRequestStatusColor(request.status) as any} 
                  className="capitalize"
                >
                  {request.status}
                </Badge>
                {request.categories && (
                  <span className="text-xs text-slate-500 font-medium">
                    {request.categories.name}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  • {formatRelativeTime(request.created_at)}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-navy-900 leading-snug line-clamp-2">
                {request.title}
              </h3>
            </div>
            
            {request.budget && (
              <div className="shrink-0 text-right">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Budget max</div>
                <div className="font-bold text-amber-600">
                   {formatPrice(request.budget).split(' ')[0]}
                </div>
              </div>
            )}
          </div>

          <p className="text-slate-600 text-sm line-clamp-3">
             {request.description}
          </p>
          
          {/* Footer constraints */}
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
             {isShopperView ? (
                <div className="flex items-center gap-2">
                   <span className="text-xs text-slate-500">Requested by</span>
                   <Avatar size="xs" src={request.profiles.avatar_url} name={request.profiles.full_name} />
                   <span className="text-sm font-medium text-navy-900 truncate max-w-[100px]">
                     {request.profiles.full_name?.split(' ')[0]}
                   </span>
                </div>
             ) : (
                <div className="flex items-center gap-2">
                  {request.shopper ? (
                    <>
                       <span className="text-xs text-slate-500">Assigned to</span>
                       <Avatar size="xs" src={request.shopper.avatar_url} name={request.shopper.full_name} />
                       <span className="text-sm font-medium text-navy-900 truncate max-w-[100px]">
                         {request.shopper.full_name?.split(' ')[0]}
                       </span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500 italic">Waiting for a shopper</span>
                  )}
                </div>
             )}
             
             {request.source_url && (
               <div className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                 </svg>
                 Has Product Link
               </div>
             )}
          </div>
          
        </div>
      </Card>
    </Link>
  )
}
