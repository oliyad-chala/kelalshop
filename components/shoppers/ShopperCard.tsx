import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ShopperBadge } from './ShopperBadge'
import { getRatingStars, formatRating, truncate } from '@/lib/utils/formatters'
import type { ShopperWithProfile } from '@/types/app.types'

interface ShopperCardProps {
  shopper: ShopperWithProfile
}

export function ShopperCard({ shopper }: ShopperCardProps) {
  const { shopper_profiles: profile } = shopper
  const { shopper_categories: categories, shopper_sources: sources } = profile

  return (
    <Link href={`/shoppers/${shopper.id}`} className="block h-full">
      <Card hover className="h-full flex flex-col relative overflow-hidden">
        {/* Header pattern backgroud */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-navy-900 to-navy-800" />
        
        {/* Profile Info */}
        <div className="relative pt-6 flex items-start gap-4 mb-4">
          <Avatar 
            src={shopper.avatar_url} 
            name={shopper.full_name} 
            size="lg" 
            className="ring-4 ring-white shadow-sm mt-2" 
          />
          <div className="flex-1 mt-6">
            <h3 className="font-semibold text-lg text-navy-900 leading-tight">
              {shopper.full_name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <ShopperBadge status={profile.verification_status} />
              {shopper.location && (
                <span className="text-xs text-slate-500 flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {shopper.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 mb-4 bg-slate-50/50 rounded-xl px-2">
           <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">Orders</div>
              <div className="font-semibold text-navy-900">{profile.total_orders}+</div>
           </div>
           <div className="text-center border-l border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">Trust Score</div>
              <div className="font-semibold text-amber-600 flex items-center justify-center gap-1">
                 <span className="text-xs">{getRatingStars(shopper.trust_score)}</span>
                 {shopper.trust_score > 0 ? formatRating(shopper.trust_score) : 'New'}
              </div>
           </div>
        </div>

        {/* Categories preview */}
        {categories.length > 0 && (
          <div className="mb-4">
             <div className="flex flex-wrap gap-1.5">
               {categories.slice(0, 3).map((cat) => (
                  <Badge key={cat.categories.id} variant="default" className="bg-slate-100/80 text-slate-600 font-normal">
                     {cat.categories.name}
                  </Badge>
               ))}
               {categories.length > 3 && (
                 <Badge variant="default" className="bg-slate-100/50 text-slate-500 font-normal">
                   +{categories.length - 3}
                 </Badge>
               )}
             </div>
          </div>
        )}

        <div className="mt-auto pt-2">
           <p className="text-sm text-slate-600 line-clamp-2">
             {profile.bio || `Verified shopper specialized in importing goods.`}
           </p>
        </div>
      </Card>
    </Link>
  )
}
