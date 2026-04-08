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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'shopper' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(*), categories(*), profiles(*)')
    .eq('shopper_id', user.id)
    .order('created_at', { ascending: false })

  const items = products as ProductWithDetails[] | null

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
          <div className="overflow-x-auto">
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
                        {/* Note: In a real app we'd use forms hitting server actions for these buttons */}
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
