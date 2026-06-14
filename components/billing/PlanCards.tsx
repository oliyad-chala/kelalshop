'use client'

import { CheckCircle2, XCircle, Sparkles, Crown } from 'lucide-react'
import { SUBSCRIPTION_PLANS, formatEtb, type PlanConfig } from '@/lib/config/billing-pricing'

interface PlanCardsProps {
  activePlan: string
  onSelectPlan: (plan: PlanConfig) => void
  selectedPlanKey?: string
}

export function PlanCards({ activePlan, onSelectPlan, selectedPlanKey }: PlanCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {SUBSCRIPTION_PLANS.map((plan) => {
        const isCurrent = activePlan === plan.key || (activePlan === 'pro' && plan.key === 'monthly')
        const isSelected = selectedPlanKey === plan.key
        const isHighlighted = plan.highlight

        return (
          <div
            key={plan.key}
            className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all duration-200 ${
              isHighlighted
                ? 'border-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-lg shadow-amber-100'
                : isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                  <Crown className="w-3 h-3" />
                  {plan.badge}
                </span>
              </div>
            )}

            {/* Plan header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-bold uppercase tracking-wider ${isHighlighted ? 'text-amber-700' : 'text-slate-500'}`}>
                  {plan.name}
                </span>
                {isCurrent && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>

              <div className="flex items-end gap-1">
                {plan.price === 0 ? (
                  <span className="text-3xl font-black text-navy-900">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-black text-navy-900">{formatEtb(plan.price)}</span>
                    <span className="text-sm text-slate-400 mb-1">/{plan.period}</span>
                  </>
                )}
              </div>

              {plan.savings && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    {plan.savings}
                  </span>
                </div>
              )}
            </div>

            {/* Features list */}
            <ul className="space-y-2 flex-1 mb-5">
              {plan.features.map((feature) => (
                <li key={feature.text} className="flex items-start gap-2 text-xs">
                  {feature.included ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={feature.included ? 'text-navy-900' : 'text-slate-400 line-through'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA button */}
            {plan.paymentType === null ? (
              <div className="text-center text-xs text-slate-400 font-semibold py-2">
                {isCurrent ? '✓ Your current plan' : 'Always free'}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelectPlan(plan)}
                disabled={isCurrent}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-150 ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : isHighlighted
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200 hover:shadow-lg hover:scale-[1.02]'
                    : 'bg-navy-900 text-white hover:bg-navy-800 hover:shadow-md'
                }`}
              >
                {isCurrent ? 'Current Plan' : isSelected ? '✓ Selected' : `Get ${plan.name}`}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
