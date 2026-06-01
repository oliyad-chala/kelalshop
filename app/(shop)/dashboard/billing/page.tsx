import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatters'
import { PaymentForm } from '@/components/billing/PaymentForm'
import { PaymentHistory } from '@/components/billing/PaymentHistory'
import { CheckCircle2, Zap, ShieldCheck } from 'lucide-react'
import {
  PRO_SUBSCRIPTION_MONTHLY_ETB,
  BOOST_7_DAYS_ETB,
  BOOST_28_DAYS_ETB,
  formatEtb,
} from '@/lib/config/billing-pricing'

export const metadata = {
  title: 'Billing & Subscriptions | KelalShop',
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ boostProductId?: string; plan?: string; tab?: string }>
}) {
  const resolvedParams = await searchParams
  const boostProductIdParam = resolvedParams.boostProductId
  const activeTab =
    resolvedParams.tab === 'boosts' || boostProductIdParam ? 'boosts' : 'subscription'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let boostProductId: string | undefined
  if (boostProductIdParam) {
    const { data: owned } = await supabase
      .from('products')
      .select('id')
      .eq('id', boostProductIdParam)
      .eq('shopper_id', user.id)
      .maybeSingle()
    if (owned) boostProductId = owned.id
  }

  const { data: profile, error } = await supabase
    .from('shopper_profiles')
    .select('subscription_plan, subscription_expires_at, verification_status')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile && !error) {
    redirect('/dashboard')
  }

  const plan = profile?.subscription_plan || 'free'
  const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
  const isExpired = expiresAt && expiresAt < new Date()
  const activePlan = isExpired ? 'free' : plan

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .eq('shopper_id', user.id)
    .order('created_at', { ascending: false })

  const { data: payments } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('shopper_id', user.id)
    .order('created_at', { ascending: false })

  // --- GUIDED FLOW FOR EXPIRED SUBSCRIPTION ---
  if (isExpired) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-500 mb-6 shadow-sm ring-8 ring-red-50/50">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 mb-4 tracking-tight">Your Free Trial Has Ended</h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Your products are currently paused and invisible to buyers. Upgrade to the <strong className="text-amber-600">Pro Plan</strong> to reactivate your listings and unlock unlimited sales with 0% commission.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 p-8 text-center border-b border-navy-700">
             <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
             <div className="text-amber-400 text-3xl font-black">{formatEtb(PRO_SUBSCRIPTION_MONTHLY_ETB)} <span className="text-base font-normal text-navy-200">/ month</span></div>
          </div>
          <div className="p-8">
            <PaymentForm 
              userId={user.id} 
              products={[]} 
              mode="subscription"
            />
          </div>
        </div>
      </div>
    )
  }

  // --- STANDARD BILLING PAGE (TABBED) ---
  return (
    <div className="space-y-8 fade-in max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Billing & Subscriptions</h1>
        <p className="text-slate-500 mt-1">
          Manage your seller subscription, advertising boosts, and view payment history.
        </p>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex gap-2 border-b border-slate-200">
        <Link 
          href="/dashboard/billing?tab=subscription" 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'subscription' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-navy-900 hover:border-slate-300'}`}
        >
          Subscription Plan
        </Link>
        <Link 
          href="/dashboard/billing?tab=boosts" 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'boosts' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-navy-900 hover:border-slate-300'}`}
        >
          <Zap size={16} />
          Product Boosts
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* LEFT COLUMN: INFO */}
        <div className="space-y-6">
          {activeTab === 'subscription' ? (
            <div className="bg-gradient-to-br from-navy-900 to-navy-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-lg text-white h-full border border-navy-700/50">
              <div className="absolute top-0 right-0 p-6">
                <Badge variant={activePlan === 'free' ? 'slate' : 'success'} size="md" className="uppercase tracking-widest font-bold bg-white/10 text-white border-0 backdrop-blur-sm">
                  {activePlan} Plan
                </Badge>
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

              <ShieldCheck className="w-10 h-10 text-blue-400 mb-4 opacity-80" />
              <h2 className="text-lg font-medium text-navy-200 mb-1">Current Subscription</h2>
              <div className="text-4xl font-extrabold mb-8 tracking-tight">
                {activePlan === 'free' ? 'Free Trial' : 'Pro Monthly'}
              </div>
              
              <ul className="space-y-4 mb-8 text-sm text-navy-100">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{activePlan === 'free' ? 'Up to 3 active listings' : 'Unlimited active listings'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Direct buyer payments (0% commission)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Priority customer support</span>
                </li>
              </ul>

              {activePlan !== 'free' && expiresAt && (
                <div className="text-sm font-medium text-amber-300 bg-amber-500/10 inline-block px-4 py-2 rounded-lg border border-amber-500/20">
                  Renews on {formatDate(expiresAt.toISOString())}
                </div>
              )}
            </div>
          ) : (
             <div className="bg-white rounded-3xl border border-amber-100 p-6 sm:p-8 shadow-sm h-full">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <Zap size={24} className="fill-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-navy-900 mb-3">Boost Your Visibility</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Stand out from the competition. Boosting a product pushes it to the top of search results and category pages, significantly increasing your chances of making a sale.
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="font-semibold text-navy-900">7 Days Boost</div>
                    <div className="font-bold text-amber-600">{formatEtb(BOOST_7_DAYS_ETB)}</div>
                  </div>
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full -z-0"></div>
                    <div className="font-semibold text-amber-900 relative z-10 flex items-center gap-2">
                       28 Days Boost
                       <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Best Value</span>
                    </div>
                    <div className="font-bold text-amber-700 relative z-10">{formatEtb(BOOST_28_DAYS_ETB)}</div>
                  </div>
                </div>
             </div>
          )}
        </div>

        {/* RIGHT COLUMN: PAYMENT FORM */}
        <div className="space-y-4">
          {activeTab === 'subscription' && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Pro Plan price</p>
              <p className="text-2xl font-extrabold text-navy-900">{formatEtb(PRO_SUBSCRIPTION_MONTHLY_ETB)}<span className="text-sm font-medium text-slate-500"> / month</span></p>
              <p className="text-xs text-slate-500 mt-2">Unlimited listings · 0% commission · priority support</p>
            </div>
          )}
           <PaymentForm 
             userId={user.id} 
             products={products || []} 
             mode={activeTab}
             initialBoostProductId={boostProductId}
           />
        </div>

      </div>

      {/* Payment History Section */}
      <div className="pt-8 mt-12 border-t border-slate-200">
        <h3 className="text-lg font-bold text-navy-900 mb-6">Payment History</h3>
        <PaymentHistory payments={payments || []} />
      </div>
    </div>
  )
}

