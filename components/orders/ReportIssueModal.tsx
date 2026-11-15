'use client'

import { useState } from 'react'
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { disputeOrder } from '@/lib/actions/orders'
import { formatPrice } from '@/lib/utils/formatters'

interface ReportIssueModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  productName: string
  orderAmount: number
  onSuccess: () => void
}

const COMMON_REASONS = [
  'Item never arrived & seller unreachable',
  'Item arrived damaged or broken',
  'Received wrong item, color, or size',
  'Item looks counterfeit or does not match description',
  'Other issue',
]

export function ReportIssueModal({
  isOpen,
  onClose,
  orderId,
  productName,
  orderAmount,
  onSuccess,
}: ReportIssueModalProps) {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0])
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const fullReason = details.trim()
      ? `${selectedReason}: ${details.trim()}`
      : selectedReason

    if (fullReason.length < 5) {
      setError('Please provide a brief description of the issue.')
      return
    }

    try {
      setIsSubmitting(true)
      await disputeOrder(orderId, fullReason)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit dispute. Please try again.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/50">
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-navy-900 text-base">Report an Issue / Dispute</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-navy-900">Dispute Submitted to Admin</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our support mediation team has been notified. The order status has been placed on hold and we will review the case with both you and the shopper.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Order Brief */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-400 block font-medium">Order Item</span>
              <p className="font-bold text-navy-900 mt-0.5 truncate">{productName}</p>
              <span className="text-amber-600 font-bold block mt-0.5">{formatPrice(orderAmount)}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                What is the issue?
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-navy-900 bg-white focus:border-red-500 outline-none"
              >
                {COMMON_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what happened or what resolution you expect..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-navy-900 focus:border-red-500 outline-none resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
