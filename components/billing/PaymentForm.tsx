'use client'

import { useActionState, useState } from 'react'
import { submitPaymentRequest } from '@/lib/actions/payments'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PaymentFormProps {
  userId: string
  products: { id: string; name: string; price: number }[]
  initialBoostProductId?: string
  requestedPlan?: string
}

const initialState = { error: '', success: '' }

export function PaymentForm({ userId, products, initialBoostProductId, requestedPlan }: PaymentFormProps) {
  const [state, formAction, isPending] = useActionState(submitPaymentRequest, initialState)
  
  // Default to Pro Subscription if they clicked 'Upgrade to Pro'
  const defaultType = requestedPlan === 'pro' ? 'pro_subscription' : (initialBoostProductId ? 'boost_7_days' : 'pro_subscription')
  const [paymentType, setPaymentType] = useState(defaultType)

  return (
    <form action={formAction}>
      {state?.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.error}
        </div>
      )}
      
      {state?.success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-100 flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {state.success}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="payment_type" className="block text-sm font-semibold text-navy-900 mb-2">
            What are you paying for?
          </label>
          <select
            id="payment_type"
            name="payment_type"
            required
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
          >
            <option value="pro_subscription">Pro Subscription (Monthly) - 1,000 ETB</option>
            <option value="boost_7_days">Boost Listing (7 Days) - 300 ETB</option>
            <option value="boost_28_days">Boost Listing (28 Days) - 3,000 ETB</option>
          </select>
        </div>

        {paymentType !== 'pro_subscription' && (
          <div>
            <label htmlFor="target_id" className="block text-sm font-semibold text-navy-900 mb-2">
              Select Product to Boost <span className="text-red-500">*</span>
            </label>
            <select
              id="target_id"
              name="target_id"
              required
              defaultValue={initialBoostProductId || ''}
              className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
            >
              <option value="" disabled>-- Select a product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — ETB {p.price}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="reference_number" className="block text-sm font-semibold text-navy-900 mb-2">
            Bank Transaction Reference Number
          </label>
          <Input
            id="reference_number"
            name="reference_number"
            placeholder="e.g. FT230514X9A1"
            className="h-12 bg-white"
            required
          />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" className="w-full text-base font-bold shadow-md shadow-amber-500/20" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Verify My Payment'}
          </Button>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-bold text-navy-900 mb-2">Prefer to use Telegram?</h4>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          You can also send your receipt directly to our support team on Telegram. Please include your User ID: 
          <code className="ml-2 bg-slate-200 px-2 py-1 rounded-md text-slate-700 font-mono text-xs">{userId}</code>
        </p>
        <a 
          href={`https://t.me/kelalshop_support?text=Hello! I paid for a subscription/boost. My User ID is: ${userId}`} 
          target="_blank" 
          rel="noreferrer"
          className="block"
        >
          <Button type="button" variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
            </svg>
            Send Receipt via Telegram
          </Button>
        </a>
      </div>
    </form>
  )
}
