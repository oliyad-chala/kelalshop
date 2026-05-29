import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditProductForm } from '@/components/products/EditProductForm'
import { updateProduct } from '@/lib/actions/products'

export const metadata = {
  title: 'Edit Listing | KelalShop',
}

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Verify ownership and get product
  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('id', id)
    .eq('shopper_id', user.id)
    .single()

  if (!product) {
    redirect('/dashboard/listings')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  // Bind the server action with the product id
  const boundAction = updateProduct.bind(null, id)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Edit Listing</h1>
        <p className="text-slate-500 mt-1">Update your product information.</p>
      </div>
      <EditProductForm 
        categories={categories || []} 
        initialData={product} 
        action={boundAction}
      />
    </div>
  )
}
