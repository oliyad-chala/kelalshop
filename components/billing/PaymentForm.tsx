'use client'

import { useActionState, useMemo, useState } from 'react'
import { submitPaymentRequest } from '@/lib/actions/payments'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { CheckCircle2, Package } from 'lucide-react'
import {
  formatBoostOptionLabel,
  formatEtb,
  getPaymentAmount,
  SUBSCRIPTION_PLANS,
  type PlanConfig,
} from '@/lib/config/billing-pricing'
import { PlanCards } from './PlanCards'

interface PaymentFormProps {
  userId: string
  products: { id: string; name: string; price: number }[]
  mode: 'subscription' | 'boosts'
  initialBoostProductId?: string
  activePlan?: string
}

const initialState = { error: '', success: '' }

export function PaymentForm({ userId, products, mode, initialBoostProductId, activePlan = 'free' }: PaymentFormProps) {
  const [state, formAction, isPending] = useActionState(submitPaymentRequest, initialState)
  const [paymentMethod, setPaymentMethod] = useState<'cbe' | 'telebirr'>('cbe')

  // Subscription plan selection state
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null)

  // Boost state
  const [paymentType, setPaymentType] = useState('boost_7_days')
  const lockedProduct = initialBoostProductId
    ? products.find((p) => p.id === initialBoostProductId)
    : undefined
  const [targetProductId, setTargetProductId] = useState(
    lockedProduct?.id ?? initialBoostProductId ?? ''
  )

  const amountDue = useMemo(() => {
    if (mode === 'subscription') {
      return selectedPlan ? getPaymentAmount(selectedPlan.paymentType!) ?? 0 : 0
    }
    const amount = getPaymentAmount(paymentType)
    return amount ?? 0
  }, [mode, selectedPlan, paymentType])

  if (state?.success) {
    return (
      <div className="bg-emerald-50 rounded-2xl p-8 text-center border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-navy-900 mb-2">Receipt Submitted!</h3>
        <p className="text-emerald-700 leading-relaxed max-w-sm mx-auto">
          {state.success}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-6" variant="outline">
          Submit another
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Plan cards — subscription mode only */}
      {mode === 'subscription' && (
        <PlanCards
          activePlan={activePlan}
          selectedPlanKey={selectedPlan?.key}
          onSelectPlan={(plan) => setSelectedPlan(plan)}
        />
      )}

      {/* Payment form — only shown once a plan is selected (or always for boosts) */}
      {(mode === 'boosts' || selectedPlan !== null) && (
        <form action={formAction} className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-8 relative">
          {/* Hidden fields */}
          {mode === 'subscription' && selectedPlan && (
            <input type="hidden" name="payment_type" value={selectedPlan.paymentType!} />
          )}

          {state?.error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {state.error}
            </div>
          )}

          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-base font-bold text-navy-900">Transfer the Amount</h3>
              </div>

              {mode === 'boosts' && (
                <div className="pl-9 mb-6 space-y-4">
                  <div>
                    <label htmlFor="payment_type" className="block text-sm font-semibold text-navy-900 mb-2">Select Duration</label>
                    <Select
                      id="payment_type"
                      name="payment_type"
                      required
                      value={paymentType}
                      onChange={(val) => setPaymentType(val)}
                      options={[
                        { value: 'boost_7_days', label: formatBoostOptionLabel('boost_7_days') },
                        { value: 'boost_28_days', label: formatBoostOptionLabel('boost_28_days') },
                      ]}
                    />
                  </div>

                  {lockedProduct ? (
                    <div>
                      <p className="block text-sm font-semibold text-navy-900 mb-2">Product to boost</p>
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                        <Package className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-900 truncate">{lockedProduct.name}</p>
                          <p className="text-xs text-slate-500">Selected from your listings</p>
                        </div>
                      </div>
                      <input type="hidden" name="target_id" value={lockedProduct.id} />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="target_id" className="block text-sm font-semibold text-navy-900 mb-2">
                        Select Product to Boost <span className="text-red-500">*</span>
                      </label>
                      <Select
                        id="target_id"
                        name="target_id"
                        required
                        value={targetProductId}
                        onChange={(val) => setTargetProductId(val)}
                        options={[
                          { value: '', label: '-- Select a product --', disabled: true },
                          ...products.map((p) => ({
                            value: p.id,
                            label: p.name,
                          })),
                        ]}
                      />
                    </div>
                  )}

                  <p className="text-sm font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Amount due: {formatEtb(amountDue)}
                  </p>
                </div>
              )}

              {mode === 'subscription' && selectedPlan && (
                <div className="pl-9 mb-4">
                  <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Selected Plan</p>
                      <p className="font-bold text-navy-900">{selectedPlan.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-amber-700">{formatEtb(amountDue)}</p>
                      {selectedPlan.period && (
                        <p className="text-xs text-slate-500">/{selectedPlan.period}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pl-9">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cbe')}
                    className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg border transition-colors ${paymentMethod === 'cbe' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    CBE
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('telebirr')}
                    className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg border transition-colors ${paymentMethod === 'telebirr' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    Telebirr
                  </button>
                </div>

                {paymentMethod === 'cbe' ? (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-0"></div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 relative z-10">CBE Account</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-amber-600 mb-1 tracking-wider relative z-10">1000 1234 56789</div>
                    <div className="text-xs font-semibold text-navy-800 relative z-10">KelalShop Trading</div>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0"></div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 relative z-10">Telebirr Number</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-blue-600 mb-1 tracking-wider relative z-10">0911 23 45 67</div>
                    <div className="text-xs font-semibold text-navy-800 relative z-10">KelalShop Trading</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="text-base font-bold text-navy-900">Upload Receipt</h3>
              </div>
              <div className="pl-9">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-white hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    id="receipt"
                    name="receipt"
                    accept="image/*"
                    required
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <p className="text-xs text-slate-400 mt-2 ml-1">Upload a clear screenshot of your transaction.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full text-base font-bold shadow-md shadow-blue-500/20" disabled={isPending}>
                {isPending ? 'Uploading...' : amountDue > 0 ? `Verify My Payment · ${formatEtb(amountDue)}` : 'Verify My Payment'}
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-bold text-navy-900 mb-2">Need help?</h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Send your receipt to our support team on Telegram. User ID:
              <code className="ml-1 bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono text-[10px]">{userId}</code>
            </p>
            <a href={`https://t.me/kelalshop_support?text=Hello! I paid for a subscription/boost. My User ID is: ${userId}`} target="_blank" rel="noreferrer" className="block">
              <Button type="button" variant="outline" size="sm" className="w-full border-slate-200 text-slate-600 hover:bg-slate-100">
                Send via Telegram Instead
              </Button>
            </a>
          </div>
        </form>
      )}

      {/* Prompt when no plan selected yet */}
      {mode === 'subscription' && selectedPlan === null && (
        <div className="text-center py-6 text-slate-400 text-sm">
          ↑ Select a paid plan above to proceed with payment.
        </div>
      )}
    </div>
  )
}
