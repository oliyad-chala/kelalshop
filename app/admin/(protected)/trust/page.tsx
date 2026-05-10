import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrustTable } from '@/components/admin/TrustTable'

export const metadata = { title: 'Trust Scores' }

export default async function TrustScoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  // trust_score lives on `profiles`; shopper-specific fields on `shopper_profiles`
  const [{ data: profileRows, error: profileError }, { data: reviews }] = await Promise.all([
    admin
      .from('profiles')
      .select(`
        id, full_name, trust_score, role,
        shopper_profiles!inner(total_orders, verification_status, is_top_shopper)
      `)
      .order('trust_score', { ascending: false }),
    admin.from('reviews').select('reviewee_id, rating'),
  ])

  if (profileError) {
    console.error('Failed to fetch profiles in Admin Trust Page:', profileError)
  }

  // Build avg-rating map keyed by reviewee_id (shopper's profile id)
  const ratingMap: Record<string, { sum: number; count: number }> = {}
  for (const r of reviews ?? []) {
    if (!ratingMap[r.reviewee_id]) ratingMap[r.reviewee_id] = { sum: 0, count: 0 }
    ratingMap[r.reviewee_id].sum   += r.rating
    ratingMap[r.reviewee_id].count += 1
  }

  const rows = (profileRows ?? []).map((p: any) => {
    const sp    = Array.isArray(p.shopper_profiles) ? p.shopper_profiles[0] : p.shopper_profiles
    const rData = ratingMap[p.id] ?? { sum: 0, count: 0 }
    return {
      id:                 p.id,
      name:               p.full_name ?? '—',
      trustScore:         p.trust_score ?? 0,
      avgRating:          rData.count > 0 ? rData.sum / rData.count : 0,
      totalReviews:       rData.count,
      verificationStatus: sp?.verification_status ?? 'unverified',
      totalOrders:        sp?.total_orders ?? 0,
      isTopShopper:       sp?.is_top_shopper ?? false,
    }
  })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Trust Score Management</h1>
          <p className="section-subtitle">Monitor shopper reputation — trust scores, ratings, and verification status</p>
        </div>
        <span className="admin-badge badge-default">{rows.length} shoppers</span>
      </div>

      <TrustTable rows={rows} />
    </div>
  )
}
