import Link from 'next/link'
import type { Database } from '@/types/database.types'
import { FlashCountdown } from '@/components/home/FlashCountdown'
import { CampaignBannerImage } from '@/components/promotions/CampaignBannerImage'

type Promotion = Database['public']['Tables']['promotions']['Row']

interface FlashSaleTeaserProps {
  campaign: Promotion
}

export function FlashSaleTeaser({ campaign }: FlashSaleTeaserProps) {
  return (
    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3">
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 pt-3 pb-2 border-b border-amber-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base leading-none">⚡</span>
            <h2 className="text-sm font-bold text-navy-900">{campaign.name}</h2>
            <FlashCountdown endsAt={campaign.end_date} />
          </div>
          <Link
            href={`/promotions/${campaign.id}`}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
          >
            View campaign →
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {campaign.banner_image_url ? (
            <div className="relative w-full sm:w-48 h-28 sm:h-32 shrink-0 rounded-lg overflow-hidden bg-amber-50">
              <CampaignBannerImage
                src={campaign.banner_image_url}
                alt={campaign.name}
                fill
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex-1 flex flex-col justify-center gap-2">
            {campaign.description ? (
              <p className="text-sm text-slate-600">{campaign.description}</p>
            ) : null}
            <p className="text-sm text-slate-500">
              Deals from verified sellers are coming soon. Check back shortly for flash sale prices.
            </p>
            <Link
              href={`/promotions/${campaign.id}`}
              className="inline-flex items-center justify-center w-fit mt-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold rounded-lg text-xs transition-colors"
            >
              See campaign details
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
