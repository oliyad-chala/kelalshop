import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/formatters'
import { CampaignCountdown } from '@/components/promotions/CampaignCountdown'
import { CampaignBannerImage } from '@/components/promotions/CampaignBannerImage'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('promotions').select('name').eq('id', id).single()
  return { title: data?.name ? `${data.name} | KelalShop` : 'Campaign | KelalShop' }
}

export default async function PublicCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: campaign } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', id)
    .eq('type', 'flash_sale_campaign')
    .eq('is_active', true)
    .single()

  if (!campaign || !['upcoming', 'active'].includes(campaign.status)) {
    notFound()
  }

  const campaignStarted = campaign.start_date <= now
  const campaignNotEnded = campaign.end_date >= now

  if (campaign.status === 'active' && (!campaignStarted || !campaignNotEnded)) {
    notFound()
  }

  const { data: items } = await supabase
    .from('promotion_products')
    .select(`
      product_id,
      special_price,
      products (
        id,
        name,
        price,
        is_available,
        product_images (url, is_primary)
      )
    `)
    .eq('promotion_id', id)
    .eq('status', 'approved')

  const approvedItems = (items ?? []).filter(
    (row: any) => row.products?.is_available !== false
  )

  return (
    <main className="flex-1 bg-slate-50 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-navy-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-navy-900 font-medium">{campaign.name}</span>
        </nav>

        <header className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-8">
          {campaign.banner_image_url && (
            <div className="relative h-40 sm:h-52 bg-slate-100">
              <CampaignBannerImage
                src={campaign.banner_image_url}
                alt={campaign.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">{campaign.name}</h1>
              <span
                className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                  campaign.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {campaign.status}
              </span>
            </div>
            {campaign.description && (
              <p className="text-slate-600 mb-4 max-w-2xl">{campaign.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span>
                {new Date(campaign.start_date).toLocaleDateString()} –{' '}
                {new Date(campaign.end_date).toLocaleDateString()}
              </span>
              {campaign.target_country && (
                <span>
                  {campaign.target_country}
                  {campaign.target_region ? ` · ${campaign.target_region}` : ''}
                </span>
              )}
            </div>
            {campaign.status === 'active' && (
              <div className="mt-4">
                <CampaignCountdown endDate={campaign.end_date} />
              </div>
            )}
          </div>
        </header>

        {approvedItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
            Deals are coming soon. Check back shortly!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {approvedItems.map((item: any) => {
              const product = item.products
              const images = product?.product_images ?? []
              const imageUrl =
                images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null
              const originalPrice = Number(product.price)
              const salePrice = Number(item.special_price)
              const discountPct =
                originalPrice > salePrice
                  ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
                  : 0

              return (
                <Link
                  key={item.product_id}
                  href={`/products/${item.product_id}`}
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-slate-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl text-slate-300">
                        📦
                      </div>
                    )}
                    {discountPct > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                        -{discountPct}%
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h2 className="text-sm font-semibold text-navy-900 truncate">{product.name}</h2>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-base font-bold text-red-600">
                        {formatPrice(salePrice)}
                      </span>
                      {discountPct > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatPrice(originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
