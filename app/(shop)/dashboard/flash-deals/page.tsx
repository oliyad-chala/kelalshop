import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FlashDealsManager } from '@/components/dashboard/FlashDealsManager'

export const metadata = { title: 'Flash Deals | KelalShop' }
export const dynamic = 'force-dynamic'

export default async function FlashDealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, shopper_profiles(verification_status)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'shopper' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const sp = Array.isArray(profile.shopper_profiles)
    ? profile.shopper_profiles[0]
    : profile.shopper_profiles

  if (sp?.verification_status !== 'verified' && profile?.role !== 'admin') {
    return (
      <div className="max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">⚡ Flash Deals</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="font-bold text-amber-900 mb-2">Verification Required</h2>
          <p className="text-amber-800 text-sm">
            You must be a verified seller to create flash deals. Complete your verification first.
          </p>
        </div>
      </div>
    )
  }

  // Fetch seller's products (available listings)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .eq('shopper_id', user.id)
    .eq('is_available', true)
    .order('name')

  // Fetch all flash deals (active + past) for this seller
  const { data: deals } = await supabase
    .from('flash_deals')
    .select('id, discount_percent, ends_at, is_active, products(id, name, price)')
    .eq('shopper_id', user.id)
    .order('created_at', { ascending: false })

  // Count currently active (not expired)
  const now = new Date().toISOString()
  const activeCount = (deals ?? []).filter(
    (d: any) => d.is_active && d.ends_at > now
  ).length

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">⚡ Flash Deals</h1>
        <p className="text-slate-500 mt-1">
          Set a time-limited discount on your products to boost sales. Max 3 active deals.
        </p>
      </div>
      <FlashDealsManager
        products={(products ?? []) as any}
        deals={(deals ?? []) as any}
        activeCount={activeCount}
      />
    </div>
  )
}
