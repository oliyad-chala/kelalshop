import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { DEFAULT_SHIPPING_FEE_ETB } from '@/lib/config/checkout'

type Promotion = Database['public']['Tables']['promotions']['Row']

export type UserLocation = {
  country?: string | null
  region?: string | null
  city?: string | null
}

export type ShippingFeeResult = {
  baseFee: number
  fee: number
  discount: number
  promotionId: string | null
  promotion: Promotion | null
}

export function computeShippingFee(
  baseFee: number,
  promotion: Pick<Promotion, 'id' | 'discount_percentage'> | null
): ShippingFeeResult {
  if (!promotion) {
    return {
      baseFee,
      fee: baseFee,
      discount: 0,
      promotionId: null,
      promotion: null,
    }
  }

  const pct = Math.min(Math.max(Number(promotion.discount_percentage ?? 0), 0), 100)
  const discount = Math.round((baseFee * pct) / 100 * 100) / 100
  const fee = Math.max(baseFee - discount, 0)

  return {
    baseFee,
    fee,
    discount,
    promotionId: promotion.id,
    promotion: promotion as Promotion,
  }
}

/** Active shipping promotion for buyer geo (same rules as homepage banners). */
export async function getActiveShippingPromotion(
  supabase: SupabaseClient<Database>,
  location: UserLocation
): Promise<Promotion | null> {
  let query = supabase
    .from('promotions')
    .select('*')
    .eq('type', 'shipping')
    .eq('is_active', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (location.country) {
    query = query.or(`target_country.eq.${location.country},target_country.is.null`)
  } else {
    query = query.is('target_country', null)
  }

  const { data } = await query.limit(1).maybeSingle()
  return data ?? null
}

export async function resolveCheckoutShipping(
  supabase: SupabaseClient<Database>,
  location: UserLocation
): Promise<ShippingFeeResult> {
  const baseFee = DEFAULT_SHIPPING_FEE_ETB
  const promotion = await getActiveShippingPromotion(supabase, location)
  return computeShippingFee(baseFee, promotion)
}
