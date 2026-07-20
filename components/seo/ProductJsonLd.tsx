import { SITE_NAME, SITE_URL } from '@/lib/seo/site'

interface ProductJsonLdProps {
  product: {
    id: string
    name: string
    description?: string
    price: number
    image_url?: string
    category_name?: string
    rating_avg?: number
    rating_count?: number
  }
}

export function ProductJsonLd({ product }: ProductJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url ? [product.image_url] : [],
    description: product.description || `Buy ${product.name} on KelalShop Ethiopia in ETB.`,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: 'ETB',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
    },
    ...(product.rating_avg && product.rating_count ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating_avg,
        reviewCount: product.rating_count,
      }
    } : {})
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
