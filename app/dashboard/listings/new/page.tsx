import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductForm } from '@/components/products/ProductForm'

export const metadata = {
  title: 'New Listing | KelalShop',
}

export default async function NewListingPage() {
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

  // Fetch categories for the select dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Create Listing</h1>
        <p className="text-slate-500 mt-1">
          Post a new product for buyers to discover.
        </p>
      </div>

      <ProductForm categories={categories || []} />
    </div>
  )
}
