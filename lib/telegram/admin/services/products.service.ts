import { getTelegramSupabase } from '../../core/supabase-admin'

export async function getProductCount() {
  const supabase = getTelegramSupabase()
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  return { count: count ?? 0, error }
}

export async function getPendingProducts(limit = 5) {
  const supabase = getTelegramSupabase()
  return supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      profiles:shopper_id (
        shopper_profiles ( business_name )
      )
    `)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function approveProduct(productId: string) {
  const supabase = getTelegramSupabase()
  return supabase
    .from('products')
    .update({ approval_status: 'approved', is_available: true, updated_at: new Date().toISOString() })
    .eq('id', productId)
}

export async function rejectProduct(productId: string) {
  const supabase = getTelegramSupabase()
  return supabase
    .from('products')
    .update({
      approval_status: 'rejected',
      is_available: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
}

export function getStoreName(profiles: any): string {
  if (!profiles || typeof profiles !== 'object') return 'Unknown Store'
  const shopperProfile = profiles.shopper_profiles
  if (!shopperProfile || typeof shopperProfile !== 'object') return 'Unknown Store'
  return shopperProfile.business_name || 'Unknown Store'
}
