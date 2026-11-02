'use client'

import { useState } from 'react'
import { Star, X, Check, Loader2, Phone, Send, MessageSquare, Users } from 'lucide-react'
import { submitDirectSaleReview } from '@/lib/actions/reviews'

interface ReviewShopperModalProps {
  isOpen: boolean
  onClose: () => void
  shopper: {
    id: string
    name: string
  }
  product?: {
    id?: string
    name?: string
  }
  defaultChannel?: 'phone' | 'telegram' | 'in_app_chat' | 'order' | 'in_person' | 'other'
  onSuccess?: () => void
}

const QUICK_TAGS = [
  'Fast Response',
  'Item as Described',
  'Fair Price',
  'Trustworthy Seller',
  'Polite Communication',
  'Quick Delivery',
]

export function ReviewShopperModal({
  isOpen,
  onClose,
  shopper,
  product,
  defaultChannel = 'phone',
  onSuccess,
}: ReviewShopperModalProps) {
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [channel, setChannel] = useState<'phone' | 'telegram' | 'in_app_chat' | 'order' | 'in_person' | 'other'>(defaultChannel)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await submitDirectSaleReview({
        shopperId: shopper.id,
        productId: product?.id || null,
        rating,
        comment: comment.trim() || null,
        channel,
        tags: selectedTags,
      })

      if (res.error) {
        setError(res.error)
      } else {
        setIsSuccess(true)
        setTimeout(() => {
          setIsSuccess(false)
          onClose()
          if (onSuccess) onSuccess()
        }, 1800)
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while submitting your rating.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingDescriptions: Record<number, string> = {
    1: 'Poor deal / Bad experience',
    2: 'Below expectations',
    3: 'Average deal',
    4: 'Good experience, recommended!',
    5: 'Excellent! Highly trustworthy seller ⭐',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-navy-950">
              Rate {shopper.name || 'Shopper'}
            </h3>
            <p className="text-xs text-slate-500">
              {product?.name ? `Purchase: ${product.name}` : 'Direct purchase rating'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h4 className="text-lg font-bold text-navy-900">Thank You for Your Rating!</h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Your feedback helps other buyers in the community buy with confidence and increases the seller’s trust score.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Stars Section */}
            <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100/80">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Overall Experience
              </label>
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= (hoverRating || rating)
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              <p className="text-xs font-semibold text-amber-600 min-h-[1.2rem]">
                {ratingDescriptions[hoverRating || rating]}
              </p>
            </div>

            {/* How did you buy? (Channel) */}
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                How did you make this deal?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'phone', label: 'Phone Call', icon: Phone },
                  { id: 'telegram', label: 'Telegram', icon: Send },
                  { id: 'in_app_chat', label: 'In-App DM', icon: MessageSquare },
                  { id: 'in_person', label: 'In Person', icon: Users },
                ].map((item) => {
                  const Icon = item.icon
                  const isSelected = channel === item.id
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setChannel(item.id as any)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 text-navy-950 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Positive Tags */}
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                What went well? (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-navy-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5">
                Review Details (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (product quality, communication, delivery speed)..."
                rows={3}
                className="w-full text-sm rounded-xl border border-slate-200 p-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Rating</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

