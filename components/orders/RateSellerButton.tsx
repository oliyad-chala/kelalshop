'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { submitReview } from '@/lib/actions/orders'

export function RateSellerButton({ shopperName, orderId, shopperId }: { shopperName: string, orderId: string, shopperId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (submitted) {
    return (
      <span className="text-sm text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Rated {rating} Stars
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Rate Seller
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-navy-900 mb-2">Rate {shopperName}</h3>
            <p className="text-slate-500 text-sm mb-6">How was your experience buying from this seller? Your feedback helps build trust in our community.</p>
            
            {errorMsg && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <svg 
                    className={`w-12 h-12 transition-colors ${star <= (hoveredRating || rating) ? 'text-amber-400' : 'text-slate-200'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold"
                disabled={rating === 0 || isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true)
                  setErrorMsg('')
                  try {
                    await submitReview(orderId, shopperId, rating)
                    setSubmitted(true)
                    setIsOpen(false)
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Failed to submit review')
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
