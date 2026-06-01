import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/seo/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/shoppers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/requests`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/auth/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
  ]

  try {
    const supabase = await createClient()

    const [productsResult, promotionsResult, shoppersResult] = await Promise.all([
      supabase
        .from('products')
        .select('id, updated_at')
        .eq('is_available', true)
        .eq('approval_status', 'approved'),
      supabase
        .from('promotions')
        .select('id, updated_at')
        .in('status', ['upcoming', 'active'])
        .eq('is_active', true),
      supabase
        .from('shopper_profiles')
        .select('id, updated_at')
        .eq('verification_status', 'verified'),
    ])

    const productRoutes: MetadataRoute.Sitemap =
      productsResult.data?.map((p) => ({
        url: `${SITE_URL}/products/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })) ?? []

    const promotionRoutes: MetadataRoute.Sitemap =
      promotionsResult.data?.map((p) => ({
        url: `${SITE_URL}/promotions/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })) ?? []

    const shopperRoutes: MetadataRoute.Sitemap =
      shoppersResult.data?.map((s) => ({
        url: `${SITE_URL}/shoppers/${s.id}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })) ?? []

    return [...staticRoutes, ...productRoutes, ...promotionRoutes, ...shopperRoutes]
  } catch {
    return staticRoutes
  }
}
