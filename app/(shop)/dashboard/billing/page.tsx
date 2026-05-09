import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatters'
import { PaymentForm } from '@/components/billing/PaymentForm'

export const metadata = {
  title: 'Billing & Subscriptions | KelalShop',
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { boostProductId?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('shopper_profiles')
    .select('subscription_plan, subscription_expires_at, verification_status')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    // Supabase returns an error if the migration hasn't run yet. 
    // We suppress the console.error here to prevent the Next.js error overlay.
  }

  if (!profile && !error) {
    // Not a shopper
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

  const boostProductId = searchParams.boostProductId

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Billing & Subscriptions</h1>
        <p className="text-slate-500 mt-1">
          Manage your seller subscription and advertising boosts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <Badge variant={activePlan === 'free' ? 'default' : 'success'} size="md" className="uppercase tracking-wider font-bold">
              {activePlan} Plan
            </Badge>
          </div>
          <h2 className="text-lg font-bold text-navy-900 mb-2">Current Subscription</h2>
          <div className="text-3xl font-extrabold text-navy-900 mb-4">
            {activePlan === 'free' ? 'Free' : 'Pro'}
          </div>
          <ul className="space-y-3 mb-6 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {activePlan === 'free' ? 'Up to 3 active listings' : 'Unlimited active listings'}
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Direct buyer payments (0% commission)
            </li>
          </ul>
          {activePlan !== 'free' && expiresAt && (
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg inline-block">
              Renews on {formatDate(expiresAt.toISOString())}
            </div>
          )}
        </Card>

        {/* Upgrade / Boost Pricing */}
        <Card className="p-6 bg-amber-50 border-amber-200">
          <h2 className="text-lg font-bold text-navy-900 mb-4">Pricing Plans</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-amber-200/50">
              <span className="font-semibold text-navy-900">Pro Subscription (Monthly)</span>
              <span className="font-bold text-amber-700">1,000 ETB</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-amber-200/50">
              <span className="font-semibold text-navy-900">Boost Listing (7 Days)</span>
              <span className="font-bold text-amber-700">300 ETB</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-amber-200/50">
              <span className="font-semibold text-navy-900">Boost Listing (28 Days)</span>
              <span className="font-bold text-amber-700">3,000 ETB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-navy-900">Home Page Banner Ad</span>
              <span className="font-bold text-amber-700">Contact Us</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Manual Payment Instructions */}
      <Card className="p-8 border-blue-200 bg-blue-50/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">How to Upgrade or Boost</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              To upgrade your plan or boost a listing, please transfer the exact amount to our official bank account. 
              After completing the transfer, send a screenshot of the receipt via Telegram or contact our support team.
            </p>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 mb-6 max-w-md shadow-sm">
              <div className="text-sm text-slate-500 mb-1">Commercial Bank of Ethiopia (CBE)</div>
              <div className="text-xl font-mono font-bold text-navy-900 mb-2 tracking-wider">1000 1234 56789</div>
              <div className="text-sm font-semibold text-navy-700">Account Name: KelalShop Trading</div>
            </div>

            <PaymentForm 
              userId={user.id} 
              products={products || []} 
              initialBoostProductId={boostProductId} 
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
