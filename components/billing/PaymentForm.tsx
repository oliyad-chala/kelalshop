'use client'

import { useActionState, useEffect } from 'react'
import { submitPaymentRequest } from '@/lib/actions/payments'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PaymentFormProps {
  userId: string
  products: { id: string; name: string; price: number }[]
  initialBoostProductId?: string
}

const initialState = { error: '', success: '' }

export function PaymentForm({ userId, products, initialBoostProductId }: PaymentFormProps) {
  const [state, formAction, isPending] = useActionState(submitPaymentRequest, initialState)

  return (
    <form action={formAction} className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-navy-900 mb-4">Submit Payment Reference</h3>
      <p className="text-sm text-slate-500 mb-5">
        After transferring the money to our CBE account, submit your transaction reference number here for fast verification.
      </p>

      {state?.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
          {state.error}
        </div>
      )}
      
      {state?.success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-100">
          {state.success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="payment_type" className="block text-sm font-medium text-slate-700 mb-1">
            What are you paying for?
          </label>
          <select
            id="payment_type"
            name="payment_type"
            required
            defaultValue={initialBoostProductId ? 'boost_7_days' : 'pro_subscription'}
            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          >
            <option value="pro_subscription">Pro Subscription (Monthly) - 1,000 ETB</option>
            <option value="boost_7_days">Boost Listing (7 Days) - 300 ETB</option>
            <option value="boost_28_days">Boost Listing (28 Days) - 3,000 ETB</option>
          </select>
        </div>

        <div>
          <label htmlFor="target_id" className="block text-sm font-medium text-slate-700 mb-1">
            Select Product to Boost (Optional)
          </label>
          <select
            id="target_id"
            name="target_id"
            defaultValue={initialBoostProductId || ''}
            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          >
            <option value="">-- I am paying for a Subscription --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — ETB {p.price}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reference_number" className="block text-sm font-medium text-slate-700 mb-1">
            Bank Transaction Reference Number
          </label>
          <Input
            id="reference_number"
            name="reference_number"
            placeholder="e.g. FT230514X9A1"
            required
          />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Verify My Payment'}
          </Button>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-sm font-bold text-navy-900 mb-2">Prefer to use Telegram?</h4>
        <p className="text-sm text-slate-500 mb-4">
          You can also send your receipt directly to our support team on Telegram. Please include your User ID: 
          <code className="ml-2 bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono text-xs">{userId}</code>
        </p>
        <a 
          href={`https://t.me/kelalshop_support?text=Hello! I paid for a subscription/boost. My User ID is: ${userId}`} 
          target="_blank" 
          rel="noreferrer"
          className="block"
        >
          <Button type="button" variant="outline" className="w-full sm:w-auto border-blue-200 text-blue-600 hover:bg-blue-50">
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
