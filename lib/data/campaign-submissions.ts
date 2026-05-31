import type { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export type CampaignSubmission = {
  promotion_id: string
  product_id: string
  shopper_id: string
  special_price: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  products: {
    id: string
    name: string
    price: number
    stock: number
    location: string | null
    product_images: { url: string; is_primary: boolean }[]
  } | null
  profiles: { full_name: string; email: string } | null
}

/** Load campaign opt-ins without fragile PostgREST embed hints. */
export async function fetchCampaignSubmissions(
  admin: AdminClient,
  promotionId: string
): Promise<{ submissions: CampaignSubmission[]; error?: string }> {
  const { data: rows, error: rowsError } = await admin
    .from('promotion_products')
    .select('*')
    .eq('promotion_id', promotionId)
    .order('created_at', { ascending: false })

  if (rowsError) {
    return { submissions: [], error: rowsError.message }
  }

  if (!rows?.length) {
    return { submissions: [] }
  }

  const productIds = [...new Set(rows.map((r) => r.product_id))]
  const shopperIds = [...new Set(rows.map((r) => r.shopper_id))]

  const [{ data: products }, { data: profiles }] = await Promise.all([
    admin
      .from('products')
      .select('id, name, price, stock, location, product_images(url, is_primary)')
      .in('id', productIds),
    admin.from('profiles').select('id, full_name, email').in('id', shopperIds),
  ])

  const productMap = new Map((products ?? []).map((p) => [p.id, p]))
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
  )

  const submissions: CampaignSubmission[] = rows.map((row) => ({
    promotion_id: row.promotion_id,
    product_id: row.product_id,
    shopper_id: row.shopper_id,
    special_price: Number(row.special_price),
    status: row.status as CampaignSubmission['status'],
    created_at: row.created_at,
    updated_at: row.updated_at,
    products: productMap.get(row.product_id) ?? null,
    profiles: profileMap.get(row.shopper_id) ?? null,
  }))

  return { submissions }
}
