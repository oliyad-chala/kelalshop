import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Seller Campaigns' }

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Check if they are a shopper
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'shopper') {
    redirect('/dashboard')
  }

  // Fetch upcoming and active campaigns
  const { data: campaigns } = await supabase
    .from('promotions')
    .select('*')
    .in('status', ['upcoming', 'active'])
    .eq('is_active', true)
    .eq('type', 'flash_sale_campaign')
    .order('start_date', { ascending: true })

  // Fetch shopper's existing opt-ins
  const { data: optIns } = await supabase
    .from('promotion_products')
    .select('promotion_id, product_id, status')
    .eq('shopper_id', user.id)

  const getOptInStatus = (promoId: string) => {
    const optIn = optIns?.find(o => o.promotion_id === promoId)
    return optIn?.status || null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaigns & Flash Sales</h1>
        <p className="text-gray-600">Opt-in your products to platform-wide sales events to boost your visibility.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns?.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
            No upcoming campaigns right now. Check back later!
          </div>
        ) : campaigns?.map(campaign => {
          const status = getOptInStatus(campaign.id)
          
          return (
            <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              {campaign.banner_image_url && (
                <div className="h-32 bg-gray-100 relative">
                   <img src={campaign.banner_image_url} alt={campaign.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  <p>Starts: {new Date(campaign.start_date).toLocaleDateString()}</p>
                  <p>Ends: {new Date(campaign.end_date).toLocaleDateString()}</p>
                  {campaign.target_country && (
                    <p>Target: {campaign.target_country} {campaign.target_region ? `(${campaign.target_region})` : ''}</p>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                  {status ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Your Status:</span>
                      <span className={`text-sm font-bold ${
                        status === 'approved' ? 'text-green-600' :
                        status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors">
                      Join Campaign
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
