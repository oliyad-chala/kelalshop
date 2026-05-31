import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type CampaignOffer = {
  promotionId: string
  specialPrice: number
  originalPrice: number
  discountPct: number
}

export type ResolvedPrice = {
  price: number
  originalPrice: number
  discountPct: number
  campaignId: string | null
  onSale: boolean
}

export function resolveDisplayPrice(basePrice: number, offer: CampaignOffer | null): ResolvedPrice {
  if (!offer || offer.specialPrice >= basePrice) {
    return {
      price: basePrice,
      originalPrice: basePrice,
      discountPct: 0,
      campaignId: null,
      onSale: false,
    }
  }

  const discountPct = Math.round((1 - offer.specialPrice / basePrice) * 100)
  return {
    price: offer.specialPrice,
    originalPrice: basePrice,
    discountPct,
    campaignId: offer.promotionId,
    onSale: true,
  }
}

/** Fetch the best active approved campaign offer for a product. */
export async function getActiveCampaignOffer(
  supabase: SupabaseClient<Database>,
  productId: string,
  basePrice: number
): Promise<CampaignOffer | null> {
  const { data } = await supabase
    .from('promotion_products')
    .select(`
      promotion_id,
      special_price,
      promotions!inner (
        id,
        status,
        is_active,
        type,
        start_date,
        end_date
      )
    `)
    .eq('product_id', productId)
    .eq('status', 'approved')
    .eq('promotions.status', 'active')
    .eq('promotions.is_active', true)
    .eq('promotions.type', 'flash_sale_campaign')
    .lte('promotions.start_date', new Date().toISOString())
    .gte('promotions.end_date', new Date().toISOString())
    .order('special_price', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const specialPrice = Number(data.special_price)
  return {
    promotionId: data.promotion_id,
    specialPrice,
    originalPrice: basePrice,
    discountPct: Math.round((1 - specialPrice / basePrice) * 100),
  }
}

/** Server-side price resolution via RPC (falls back to query helper). */
export async function resolveOrderPrice(
  supabase: SupabaseClient<Database>,
  productId: string,
  basePrice: number
): Promise<number> {
  const { data: rpcPrice, error } = await supabase.rpc('get_active_campaign_price', {
    p_product_id: productId,
  })

  if (!error && rpcPrice != null && Number(rpcPrice) < basePrice) {
    return Number(rpcPrice)
  }

  const offer = await getActiveCampaignOffer(supabase, productId, basePrice)
  return offer ? offer.specialPrice : basePrice
}

/** Resolve effective prices for multiple products (e.g. cart hydration). */
export async function resolveProductPrices(
  supabase: SupabaseClient<Database>,
  products: { id: string; price: number }[]
): Promise<Map<string, number>> {
  const prices = new Map<string, number>()
  await Promise.all(
    products.map(async (p) => {
      const effective = await resolveOrderPrice(supabase, p.id, p.price)
      prices.set(p.id, effective)
    })
  )
  return prices
}
