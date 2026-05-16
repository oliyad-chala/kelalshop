import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatters'
import { PaymentForm } from '@/components/billing/PaymentForm'
import { PaymentHistory } from '@/components/billing/PaymentHistory'

export const metadata = {
  title: 'Billing & Subscriptions | KelalShop',
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ boostProductId?: string }>
}) {
  // In Next.js 15+, searchParams is a Promise — must be awaited
  const resolvedParams = await searchParams
  const boostProductId = resolvedParams.boostProductId

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('shopper_profiles')
    .select('subscription_plan, subscription_expires_at, verification_status')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile && !error) {
    // Not a shopper
    redirect('/dashboard')
  }

  const plan = profile?.subscription_plan || 'free'
  const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
  const isExpired = expiresAt && expiresAt < new Date()
  const activePlan = isExpired ? 'free' : plan

  // Fetch products for boosting
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .eq('shopper_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch payment history
  const { data: payments } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('shopper_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-10 fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Billing & Subscriptions</h1>
        <p className="text-slate-500 mt-1">
          Manage your seller subscription, advertising boosts, and view payment history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Plans & Pricing */}
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-lg text-white">
            <div className="absolute top-0 right-0 p-6">
              <Badge variant={activePlan === 'free' ? 'slate' : 'success'} size="md" className="uppercase tracking-widest font-bold bg-white/10 text-white border-0 backdrop-blur-sm">
                {activePlan} Plan
              </Badge>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>

            <h2 className="text-lg font-medium text-navy-200 mb-2">Current Subscription</h2>
            <div className="text-4xl font-extrabold mb-6">
              {activePlan === 'free' ? 'Free' : 'Pro'}
            </div>
            
            <ul className="space-y-3 mb-6 text-sm text-navy-100">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {activePlan === 'free' ? 'Up to 3 active listings' : 'Unlimited active listings'}
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                Direct buyer payments (0% commission)
              </li>
            </ul>

            {activePlan !== 'free' && expiresAt && (
              <div className="text-sm font-medium text-amber-300 mt-8">
                Renews on {formatDate(expiresAt.toISOString())}
              </div>
            )}
          </div>

          {/* Pricing Plans List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-navy-900 mb-5">Available Upgrades</h2>
            <div className="space-y-0 divide-y divide-slate-100">
              <div className="flex justify-between items-center py-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-navy-900">Pro Subscription (Monthly)</span>
                </div>
                <span className="font-bold text-amber-600">1,000 ETB</span>
              </div>
              <div className="flex justify-between items-center py-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="font-semibold text-navy-900">Boost Listing (7 Days)</span>
                </div>
                <span className="font-bold text-amber-600">300 ETB</span>
              </div>
              <div className="flex justify-between items-center py-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="font-semibold text-navy-900">Boost Listing (28 Days)</span>
                </div>
                <span className="font-bold text-amber-600">3,000 ETB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Form */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900 mb-1">Submit Payment</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                To upgrade or boost, transfer the amount to our CBE account and submit the reference below.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <div className="font-bold text-navy-900 text-sm">Commercial Bank of Ethiopia (CBE)</div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-600 mb-1 tracking-wider">
              1000 1234 56789
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              KelalShop Trading
            </div>
          </div>

          <PaymentForm 
            userId={user.id} 
            products={products || []} 
            initialBoostProductId={boostProductId} 
          />
        </div>
      </div>

      {/* Payment History Section */}
      <div className="pt-8 border-t border-slate-200">
        <PaymentHistory payments={payments || []} />
      </div>
    </div>
  )
}
