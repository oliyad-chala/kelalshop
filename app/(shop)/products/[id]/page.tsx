import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatPrice, getRatingStars, formatRating } from '@/lib/utils/formatters'
import { ShopperBadge } from '@/components/shoppers/ShopperBadge'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').eq('id', id).single()
  const metadata = data as any
  return { title: metadata?.name ? `${metadata.name} | KelalShop` : 'Product Not Found' }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: productResult } = await supabase
    .from('products')
    .select('*, product_images(*), categories(*), profiles:shopper_id(*), shopper_profiles:shopper_id(*)')
    .eq('id', id)
    .single()
    
  const product = productResult as any

  if (!product) {
    notFound()
  }

  const primaryImage = product.product_images.find((img: any) => img.is_primary)?.url || product.product_images[0]?.url

  return (
    <main className="flex-1 bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 w-full overflow-x-auto pb-2">
           <Link href="/" className="hover:text-navy-900 shrink-0">Home</Link>
           <span className="shrink-0">/</span>
           <Link href="/products" className="hover:text-navy-900 shrink-0">Products</Link>
           <span className="shrink-0">/</span>
           <Link href={`/products?category=${product.category_id}`} className="hover:text-navy-900 shrink-0">
             {product.categories?.name}
           </Link>
           <span className="shrink-0">/</span>
           <span className="text-navy-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
          
          {/* Photos */}
          <div className="w-full md:w-1/2 lg:w-3/5 bg-slate-100 relative min-h-[400px]">
             {primaryImage ? (
                <Image 
                  src={primaryImage} 
                  alt={product.name} 
                  fill 
                  className="object-cover" 
                  priority 
                />
             ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                   <svg className="w-20 h-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                </div>
             )}
          </div>

          {/* Details */}
          <div className="w-full md:w-1/2 lg:w-2/5 p-8 lg:p-10 flex flex-col">
            <div className="flex flex-col gap-3 items-start mb-6">
              <Badge variant={product.is_available ? 'success' : 'danger'}>
                 {product.is_available ? 'In Stock' : 'Out of Stock'}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="text-3xl font-bold text-amber-600 mb-8 border-b border-slate-100 pb-8">
              {formatPrice(product.price)}
            </div>

            <div className="prose prose-sm text-slate-600 mb-8 flex-1">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
            
            {/* Shopper Card Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8">
               <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Imported By</h4>
               <Link href={`/shoppers/${product.shopper_id}`} className="flex items-center gap-4 group">
                  <Avatar src={product.profiles.avatar_url} name={product.profiles.full_name} size="md" />
                  <div className="flex-1">
                     <div className="font-semibold text-navy-900 group-hover:text-amber-600 transition-colors">
                        {product.profiles.full_name}
                     </div>
                     <div className="flex items-center gap-2 mt-1">
                        <ShopperBadge status={product.shopper_profiles?.verification_status || 'unverified'} showText={false} />
                        {product.shopper_profiles?.trust_score > 0 && (
                          <span className="text-xs font-medium text-amber-600 flex items-center gap-0.5">
                            {getRatingStars(product.shopper_profiles.trust_score)} {formatRating(product.shopper_profiles.trust_score)}
                          </span>
                        )}
                     </div>
                  </div>
               </Link>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <Button size="lg" variant="primary" className="w-full" disabled={!product.is_available}>
                 Buy Now (Requires Auth)
              </Button>
              <Button size="lg" variant="outline" className="w-full">
                 Message Shopper
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
