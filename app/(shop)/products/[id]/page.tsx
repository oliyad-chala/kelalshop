import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatPrice, getRatingStars, formatRating } from '@/lib/utils/formatters'
import { ShopperBadge } from '@/components/shoppers/ShopperBadge'
import { BuyButton } from './BuyButton'
import { MOCK_PRODUCTS } from '@/lib/constants/mock-data'
import { ProductGallery } from '@/components/products/ProductGallery'
import { HomeProductCard } from '@/components/products/HomeProductCard'
import type { ProductWithDetails } from '@/types/app.types'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id.startsWith('mock')) {
    const mockProd = MOCK_PRODUCTS.find((p) => p.id === id)
    return { title: mockProd ? `${mockProd.name} | KelalShop` : 'Product Not Found' }
  }

  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').eq('id', id).single()
  const metadata = data as any
  return { title: metadata?.name ? `${metadata.name} | KelalShop` : 'Product Not Found' }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let product: any = null
  let relatedProducts: any[] = []

  if (id.startsWith('mock')) {
    // ── Handle Mock Product ──
    const foundMock = MOCK_PRODUCTS.find((p) => p.id === id)
    if (!foundMock) notFound()
    product = foundMock
    // Find related mock products (excluding current one, maybe from same category if categories match)
    relatedProducts = MOCK_PRODUCTS.filter(p => p.id !== id && p.categories?.id === foundMock.categories?.id).slice(0, 5)
    if (relatedProducts.length === 0) {
      relatedProducts = MOCK_PRODUCTS.filter(p => p.id !== id).slice(0, 5)
    }
  } else {
    // ── Handle Real DB Product ──
    const { data: productResult } = await supabase
      .from('products')
      .select('*, product_images(*), categories(*), profiles:shopper_id(*), shopper_profiles:shopper_id(*)')
      .eq('id', id)
      .single()

    if (!productResult) notFound()
    product = productResult

    // Fetch related products (same category)
    if (product.category_id) {
      const { data: relatedResult } = await supabase
        .from('products')
        .select('*, product_images(*), categories(*), profiles:shopper_id(*), shopper_profiles:shopper_id(*)')
        .eq('category_id', product.category_id)
        .eq('is_available', true)
        .neq('id', product.id)
        .limit(5)
      
      relatedProducts = relatedResult || []
    }
  }

  const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.url || product.product_images?.[0]?.url || null

  return (
    <main className="flex-1 bg-slate-50 py-8 md:py-12">
      {/* Reduced max-width from 7xl to 5xl for a more compact UI */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 md:mb-8 w-full overflow-x-auto pb-2">
           <Link href="/" className="hover:text-navy-900 shrink-0">Home</Link>
           <span className="shrink-0">/</span>
           <Link href="/products" className="hover:text-navy-900 shrink-0">Products</Link>
           {product.categories && (
             <>
               <span className="shrink-0">/</span>
               <Link href={`/products?category=${product.categories.id || product.category_id}`} className="hover:text-navy-900 shrink-0">
                 {product.categories.name}
               </Link>
             </>
           )}
           <span className="shrink-0">/</span>
           <span className="text-navy-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row mb-12">
          
          {/* Photos Area (Gallery) */}
          <div className="w-full md:w-[55%] p-4 sm:p-6 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
             <ProductGallery images={product.product_images || []} productName={product.name} />
          </div>

          {/* Details Area */}
          <div className="w-full md:w-[45%] p-6 sm:p-8 flex flex-col bg-white">
            <div className="flex flex-col gap-2.5 items-start mb-5">
              <Badge variant={product.is_available ? 'success' : 'danger'}>
                 {product.is_available ? 'In Stock' : 'Out of Stock'}
              </Badge>
              <h1 className="text-xl sm:text-2xl font-bold text-navy-900 leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="text-2xl font-bold text-amber-600 mb-6 border-b border-slate-100 pb-6">
              {formatPrice(product.price)}
            </div>

            <div className="prose prose-sm text-slate-600 mb-6 flex-1 text-sm">
              <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>
            
            {/* Shopper Card Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Imported By</h4>
               <Link href={`/shoppers/${product.shopper_id || 'mock'}`} className="flex items-center gap-3 group">
                  <Avatar src={product.profiles?.avatar_url} name={product.profiles?.full_name || 'Shopper'} size="md" />
                  <div className="flex-1">
                     <div className="text-sm font-bold text-navy-900 group-hover:text-amber-600 transition-colors">
                        {product.profiles?.full_name || 'Verified Shopper'}
                     </div>
                     <div className="flex items-center gap-2 mt-0.5">
                        <ShopperBadge status={product.shopper_profiles?.verification_status || 'unverified'} showText={false} />
                        {(product.profiles?.trust_score > 0 || product.shopper_profiles?.trust_score > 0) && (
                          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                            {getRatingStars(product.profiles?.trust_score || product.shopper_profiles?.trust_score)} 
                            {formatRating(product.profiles?.trust_score || product.shopper_profiles?.trust_score)}
                          </span>
                        )}
                     </div>
                  </div>
               </Link>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              {/* Client Component for cart/buy actions */}
              <BuyButton 
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  stock: product.stock ?? 99,
                  is_available: product.is_available,
                  image: primaryImage,
                  shopperName: product.profiles?.full_name || 'Shopper',
                  shopperId: product.shopper_id || 'mock',
                }}
              />

              <Button size="lg" variant="outline" className="w-full">
                 Message Shopper
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-navy-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {relatedProducts.map((p) => (
                <HomeProductCard key={p.id} product={p as unknown as ProductWithDetails} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
