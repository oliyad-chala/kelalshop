import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { ShopperBadge } from './ShopperBadge'
import { formatRating } from '@/lib/utils/formatters'
import type { ShopperWithProfile } from '@/types/app.types'

interface ShopperCardProps {
  shopper: ShopperWithProfile
}

export function ShopperCard({ shopper }: ShopperCardProps) {
  const profileArray = shopper.shopper_profiles as any
  const profile = Array.isArray(profileArray) ? profileArray[0] : profileArray
  const categories = profile?.shopper_categories || []

  return (
    <Link href={`/shoppers/${shopper.id}`} className="group block h-full">
      <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-navy-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
        
        {/* Subtle top accent instead of solid block */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 opacity-90" />

        <div className="p-6 flex-1 flex flex-col">
          {/* Header Row: Avatar + Score */}
          <div className="flex justify-between items-start mb-5">
            <Avatar 
              src={shopper.avatar_url} 
              name={shopper.full_name} 
              size="xl" 
              className="ring-4 ring-slate-50 shadow-sm" 
            />
            
            {/* Premium Trust Score Badge */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100 shadow-sm">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold text-sm">
                  {shopper.trust_score > 0 ? formatRating(shopper.trust_score) : 'New'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 pr-1">Trust Score</span>
            </div>
          </div>

          {/* Identity Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-extrabold text-xl text-navy-950 group-hover:text-amber-600 transition-colors line-clamp-1">
                {shopper.full_name}
              </h3>
              <ShopperBadge status={profile.verification_status} showText={false} className="scale-110 origin-left" />
            </div>
            
            {shopper.location && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium mb-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {shopper.location}
              </div>
            )}

            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mt-2">
              {profile.bio || `Specialized in international imports. Secure and verified partner.`}
            </p>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-3 text-sm text-navy-900 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-base">{profile.total_orders}+</span> <span className="text-slate-600">Successful Imports</span>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="flex items-center gap-3 text-sm text-navy-900 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="line-clamp-1 flex-1 leading-snug">
                  <span className="text-slate-500 font-normal mr-1">Expert in:</span>
                  {categories.map(c => c.categories.name).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between group-hover:bg-amber-50/50 transition-colors">
          <span className="font-bold text-sm text-navy-900 group-hover:text-amber-700 transition-colors">
            View Importer Profile
          </span>
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-amber-300 group-hover:text-amber-600 group-hover:bg-amber-50 shadow-sm transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
