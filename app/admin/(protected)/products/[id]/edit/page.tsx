import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditProductForm } from '@/components/products/EditProductForm'
import { adminUpdateProduct } from '@/lib/actions/admin'

export const metadata = {
  title: 'Edit Product | Admin',
}

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: product } = await admin
    .from('products')
    .select('*, product_images(*)')
    .eq('id', id)
    .single()

  if (!product) {
    redirect('/admin/products')
  }

  const { data: categories } = await admin
    .from('categories')
    .select('id, name')
    .order('name')

  const boundAction = adminUpdateProduct.bind(null, id)

  return (
    <div className="fade-in max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="section-title">Edit Product: {product.name}</h1>
          <p className="section-subtitle">Modify product details as an administrator.</p>
        </div>
      </div>
      
      {/* 
        We use the same EditProductForm, but it looks a bit "shopper-themed".
        Since it's functional, we'll wrap it in a container that constraints its width.
      */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-6 mt-6">
        <EditProductForm 
          categories={categories || []} 
          initialData={product} 
          action={boundAction}
        />
      </div>
    </div>
  )
}
