'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CampaignJoinModal } from '@/components/dashboard/CampaignJoinModal'
import { withdrawCampaignProduct } from '@/lib/actions/campaigns-seller'
import { markCampaignInvitesAsRead } from '@/lib/actions/notifications'
import { formatPrice } from '@/lib/utils/formatters'
import { CampaignBannerImage } from '@/components/promotions/CampaignBannerImage'
import Link from 'next/link'

export type SellerCampaign = {
  id: string
  name: string
  description: string | null
  status: string
  start_date: string
  end_date: string
  banner_image_url: string | null
  target_country: string | null
  target_region: string | null
  discount_percentage: number | null
}

export type SellerOptIn = {
  promotion_id: string
  product_id: string
  status: string
  special_price: number
  product_name: string
}

export type CampaignAlert = {
  id: string
  title: string
  message: string
}

type Props = {
  campaigns: SellerCampaign[]
  optIns: SellerOptIn[]
  campaignAlerts?: CampaignAlert[]
}

export function CampaignsPageClient({ campaigns, optIns, campaignAlerts = [] }: Props) {
  const router = useRouter()
  const [joinCampaign, setJoinCampaign] = useState<SellerCampaign | null>(null)
  const [withdrawing, startWithdraw] = useTransition()
  const [dismissingAlerts, startDismissAlerts] = useTransition()
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [showAlerts, setShowAlerts] = useState(campaignAlerts.length > 0)

  const optInsForCampaign = (promoId: string) =>
    optIns.filter((o) => o.promotion_id === promoId)

  const handleWithdraw = (promotionId: string, productId: string) => {
    setWithdrawError(null)
    startWithdraw(async () => {
      const result = await withdrawCampaignProduct(promotionId, productId)
      if (result.error) {
        setWithdrawError(result.error)
        return
      }
      router.refresh()
    })
  }

  const handleDismissAlerts = () => {
    startDismissAlerts(async () => {
      await markCampaignInvitesAsRead()
      setShowAlerts(false)
      router.refresh()
    })
  }

  return (
    <>
      {withdrawError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          {withdrawError}
        </p>
      )}

      {showAlerts && campaignAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                {campaignAlerts.length}
              </span>
              New campaign messages
            </h2>
            <Link
              href="/dashboard/notifications"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900"
            >
              All notifications →
            </Link>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {campaignAlerts.map((alert) => (
              <div key={alert.id} className="flex gap-2.5 items-start">
                <div className="w-9 h-9 rounded-full bg-white border border-amber-200 flex items-center justify-center shrink-0 text-base shadow-sm">
                  ⚡
                </div>
                <div className="flex-1 min-w-0 bg-white rounded-2xl rounded-tl-md border border-slate-200 px-3.5 py-2.5 shadow-sm">
                  <p className="text-xs font-bold text-navy-900">{alert.title}</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleDismissAlerts}
            disabled={dismissingAlerts}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-navy-950 rounded-lg disabled:opacity-50"
          >
            {dismissingAlerts ? 'Clearing…' : 'Got it — mark as read'}
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
            No upcoming campaigns right now. Check back later!
          </div>
        ) : (
          campaigns.map((campaign) => {
            const myOptIns = optInsForCampaign(campaign.id)

            return (
              <div
                key={campaign.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col"
              >
                {campaign.banner_image_url ? (
                  <div className="h-32 bg-gray-100 relative">
                    <CampaignBannerImage
                      src={campaign.banner_image_url}
                      alt={campaign.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center px-4">
                    <span className="text-white font-bold text-center">{campaign.name}</span>
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        campaign.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>

                  {campaign.description && (
                    <div className="mb-4 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        About this campaign
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {campaign.description}
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-gray-600 mb-4 space-y-1">
                    <p>Starts: {new Date(campaign.start_date).toLocaleDateString()}</p>
                    <p>Ends: {new Date(campaign.end_date).toLocaleDateString()}</p>
                    {campaign.target_country && (
                      <p>
                        Target: {campaign.target_country}
                        {campaign.target_region ? ` (${campaign.target_region})` : ''}
                      </p>
                    )}
                    {campaign.discount_percentage != null && campaign.discount_percentage > 0 && (
                      <p className="text-amber-700 font-medium">
                        Min. discount: {campaign.discount_percentage}%
                      </p>
                    )}
                  </div>

                  {myOptIns.length > 0 && (
                    <ul className="mb-4 space-y-2 border-t border-gray-100 pt-3">
                      <li className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Your submissions
                      </li>
                      {myOptIns.map((opt) => (
                        <li
                          key={opt.product_id}
                          className="flex items-start justify-between gap-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{opt.product_name}</p>
                            <p className="text-xs text-gray-500">
                              {formatPrice(opt.special_price)} ·{' '}
                              <span
                                className={
                                  opt.status === 'approved'
                                    ? 'text-green-600 font-semibold'
                                    : opt.status === 'rejected'
                                      ? 'text-red-600 font-semibold'
                                      : 'text-yellow-600 font-semibold'
                                }
                              >
                                {opt.status}
                              </span>
                            </p>
                          </div>
                          {opt.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleWithdraw(campaign.id, opt.product_id)}
                              disabled={withdrawing}
                              className="shrink-0 text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                            >
                              Withdraw
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setJoinCampaign(campaign)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                      {myOptIns.length > 0 ? 'Add Another Product' : 'Join Campaign'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {joinCampaign && (
        <CampaignJoinModal
          isOpen
          promotionId={joinCampaign.id}
          campaignName={joinCampaign.name}
          campaignDescription={joinCampaign.description}
          minDiscountPct={joinCampaign.discount_percentage}
          onClose={() => setJoinCampaign(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  )
}
