'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProductWithDetails } from '@/types/app.types'

export async function loadMoreProducts(
  offset: number,
  limit: number,
  params: { q?: string; category?: string; min_price?: string; max_price?: string; sort?: string }
): Promise<ProductWithDetails[]> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, product_images(*), profiles:shopper_id(*, shopper_profiles(verification_status))')
    .eq('is_available', true)
    .eq('approval_status', 'approved')

  if (params.q) {
    query = query.ilike('name', `%${params.q}%`)
  }

  if (params.category) {
    query = query.eq('category_id', params.category)
  }

  if (params.min_price) {
    query = query.gte('price', Number(params.min_price))
  }

  if (params.max_price) {
    query = query.lte('price', Number(params.max_price))
  }

  // Apply sorting
  if (params.sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (params.sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else if (params.sort === 'top_rated') {
    query = query.order('created_at', { ascending: false }) // Fallback
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data } = await query

  return data as unknown as ProductWithDetails[] || []
}
