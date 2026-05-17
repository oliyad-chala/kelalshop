import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDate } from '@/lib/utils/formatters'
import type { ProductWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'My Listings | KelalShop',
}

export default async function ListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Ensure user is a shopper
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, shopper_profiles(subscription_plan, subscription_expires_at)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'shopper' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch products
  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(*), categories(*), profiles(*)')
    .eq('shopper_id', user.id)
    .order('created_at', { ascending: false })

  let items = products as ProductWithDetails[] | null

  // ── Lazy Downgrade Check ──
  let downgradeNotice = false
  const sp = Array.isArray(profile.shopper_profiles) ? profile.shopper_profiles[0] : profile.shopper_profiles
  const plan = sp?.subscription_plan || 'free'
  const expiresAt = sp?.subscription_expires_at ? new Date(sp.subscription_expires_at) : null
  const isExpired = expiresAt && expiresAt < new Date()
  const activePlan = isExpired ? 'free' : plan

  if (activePlan === 'free' && items) {
    const activeProducts = items.filter(p => p.is_available)
    if (activeProducts.length > 3) {
      // Keep 3 most recently updated products active, deactivate the rest
      const productsToDeactivate = activeProducts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(3)
      const idsToDeactivate = productsToDeactivate.map(p => p.id)

      if (idsToDeactivate.length > 0) {
        await supabase
          .from('products')
          .update({ is_available: false } as any)
          .in('id', idsToDeactivate)
        
        downgradeNotice = true
        
        // Update local items state so the UI reflects the change immediately
        items = items.map(p => 
          idsToDeactivate.includes(p.id) ? { ...p, is_available: false } : p
        )
      }
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">My Listings</h1>
          <p className="text-slate-500 mt-1">
            Manage your product inventory and availability.
          </p>
        </div>
        <Link href="/dashboard/listings/new">
          <Button variant="primary">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Listing
          </Button>
        </Link>
      </div>

      {downgradeNotice && (
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-amber-900">Subscription Expired</h4>
            <p className="text-sm text-amber-800 mt-1">
              Your Pro subscription has expired and you are now on the Free plan. 
              The Free plan allows a maximum of 3 active listings. We have automatically hidden your older listings. 
              <Link href="/dashboard/billing" className="font-semibold underline ml-1 hover:text-amber-900">Upgrade to Pro</Link> to reactivate them.
            </p>
          </div>
        </div>
      )}

      {!items || items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">No listings yet</h3>
          <p className="text-slate-500 max-w-md mb-6">
            You haven't added any products to your store. Create your first listing to start selling.
          </p>
          <Link href="/dashboard/listings/new">
            <Button variant="primary">Create Listing</Button>
          </Link>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-slate-100">
            {items.map((product) => {
              const primaryImage = product.product_images.find(img => img.is_primary)?.url || product.product_images[0]?.url
              return (
                <div key={product.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {primaryImage ? (
                        <Image src={primaryImage} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-navy-900 line-clamp-1">{product.name}</div>
                        <div className="font-semibold text-navy-900 shrink-0">{formatPrice(product.price).split(' ')[0]}</div>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{product.categories?.name} · Stock: {product.stock}</div>
                      <div className="mt-2">
                        <Badge variant={product.is_available ? 'success' : 'default'} size="sm">
                          {product.is_available ? 'Active' : 'Hidden'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">{formatDate(product.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/billing?boostProductId=${product.id}`}>
                        <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-600 font-semibold bg-amber-50 hover:bg-amber-100 px-3 py-1.5 h-auto rounded-lg">
                          Boost 🚀
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600 px-3 py-1.5 h-auto">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600 px-3 py-1.5 h-auto">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Added</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((product) => {
                  const primaryImage = product.product_images.find(img => img.is_primary)?.url || product.product_images[0]?.url
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3 w-max">
                          <div className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                             {primaryImage ? (
                               <Image src={primaryImage} alt={product.name} fill className="object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center">
                                 <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                 </svg>
                               </div>
                             )}
                          </div>
                          <div>
                            <div className="font-medium text-navy-900 line-clamp-1 max-w-[250px]">{product.name}</div>
                            <div className="text-xs text-slate-500">{product.categories?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={product.is_available ? 'success' : 'default'}>
                          {product.is_available ? 'Active' : 'Hidden'}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-navy-900">
                        {formatPrice(product.price).split(' ')[0]}
                      </td>
                      <td className="p-4">
                        {product.stock}
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {formatDate(product.created_at)}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        <Link href={`/dashboard/billing?boostProductId=${product.id}`}>
                          <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-600 font-semibold bg-amber-50 hover:bg-amber-100 px-2 py-1 h-auto rounded">
                            Boost 🚀
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600">
                          Delete
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
