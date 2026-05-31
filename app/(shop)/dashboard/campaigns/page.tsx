import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CampaignsPageClient } from '@/components/dashboard/CampaignsPageClient'
import type { SellerCampaign, SellerOptIn } from '@/components/dashboard/CampaignsPageClient'

export const metadata = { title: 'Seller Campaigns' }

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'shopper') {
    redirect('/dashboard')
  }

  const [{ data: campaigns }, { data: optInsRaw }, { data: campaignAlerts }] = await Promise.all([
    supabase
      .from('promotions')
      .select(
        'id, name, description, status, start_date, end_date, banner_image_url, target_country, target_region, discount_percentage'
      )
      .in('status', ['upcoming', 'active'])
      .eq('is_active', true)
      .eq('type', 'flash_sale_campaign')
      .order('start_date', { ascending: true }),
    supabase
      .from('promotion_products')
      .select('promotion_id, product_id, status, special_price, products(name)')
      .eq('shopper_id', user.id),
    supabase
      .from('notifications' as any)
      .select('id, title, message')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .in('type', ['campaign_invite', 'campaign_approved', 'campaign_rejected', 'campaign_force_added'])
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const optIns: SellerOptIn[] = (optInsRaw ?? []).map((row: any) => ({
    promotion_id: row.promotion_id,
    product_id: row.product_id,
    status: row.status,
    special_price: Number(row.special_price),
    product_name: row.products?.name ?? 'Product',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaigns & Flash Sales</h1>
        <p className="text-gray-600">
          Opt-in your products to platform-wide sales events to boost your visibility.
        </p>
      </div>

      <CampaignsPageClient
        campaigns={(campaigns ?? []) as SellerCampaign[]}
        optIns={optIns}
        campaignAlerts={(campaignAlerts ?? []) as { id: string; title: string; message: string }[]}
      />
    </div>
  )
}
