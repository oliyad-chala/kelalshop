'use client'

import { useState } from 'react'
import { Star, Phone, Send, MessageSquare, Users, ShieldCheck, Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ReviewShopperModal } from './ReviewShopperModal'

interface ReviewItem {
  id: string
  rating: number
  comment?: string | null
  channel?: string | null
  tags?: string[] | null
  created_at: string
  reviewer?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  product?: {
    id: string
    name: string
  } | null
}

interface ShopperReviewsListProps {
  shopper: {
    id: string
    name: string
    trustScore?: number
  }
  reviews: ReviewItem[]
  currentUserId?: string | null
}

const channelLabels: Record<string, { label: string; icon: any; color: string }> = {
  phone: { label: 'Phone Deal 📞', icon: Phone, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  telegram: { label: 'Telegram Deal ✈️', icon: Send, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_app_chat: { label: 'In-App DM 💬', icon: MessageSquare, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  in_person: { label: 'In Person 🤝', icon: Users, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  order: { label: 'App Order 🛒', icon: ShieldCheck, color: 'bg-teal-50 text-teal-700 border-teal-200' },
}

export function ShopperReviewsList({
  shopper,
  reviews = [],
  currentUserId,
}: ShopperReviewsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isSelf = currentUserId && currentUserId === shopper.id
  const totalReviews = reviews.length
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : shopper.trustScore && shopper.trustScore > 0
    ? (shopper.trustScore / 20).toFixed(1)
    : null

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-navy-950">Ratings & Buyer Feedback</h3>
            {avgRating && (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{avgRating}</span>
                <span className="text-amber-500/70 font-normal">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verified ratings from direct phone calls, Telegram, and chat purchases
          </p>
        </div>

        {!isSelf && (
          <button
            onClick={() => {
              if (!currentUserId) {
                window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
                return
              }
              setIsModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Rate This Shopper</span>
          </button>
        )}
      </div>

      {/* Review List */}
      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No buyer reviews yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Bought an item from {shopper.name} via phone call or direct message? Be the first to leave a rating!
            </p>
          </div>
        ) : (
          reviews.map((r) => {
            const channelMeta = channelLabels[r.channel || 'phone'] || channelLabels.phone
            const ChannelIcon = channelMeta.icon
            const formattedDate = new Date(r.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })

            return (
              <div
                key={r.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={r.reviewer?.avatar_url}
                      name={r.reviewer?.full_name || 'Buyer'}
                      size="sm"
                    />
                    <div>
                      <div className="text-xs font-bold text-navy-900">
                        {r.reviewer?.full_name || 'Verified Buyer'}
                      </div>
                      <div className="text-[10px] text-slate-400">{formattedDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <span
                      className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${channelMeta.color}`}
                    >
                      <ChannelIcon className="w-2.5 h-2.5" />
                      {channelMeta.label}
                    </span>
                  </div>
                </div>

                {r.comment && (
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    {r.comment}
                  </p>
                )}

                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {r.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <ReviewShopperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shopper={shopper}
        onSuccess={() => {
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        }}
      />
    </div>
  )
}

