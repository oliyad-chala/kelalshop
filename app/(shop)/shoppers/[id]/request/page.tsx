import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RequestForm } from '@/components/requests/RequestForm'

export const metadata = {
  title: 'Request from Shopper | KelalShop',
}

export default async function ShopperRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  // Check if current user is a buyer
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUserProfile?.role === 'shopper') {
    redirect('/dashboard') // Shoppers can't make requests
  }

  // Fetch the target shopper profile
  const { data: shopperProfile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', id)
    .single()

  if (!shopperProfile) return redirect('/shoppers')

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link href={`/shoppers/${id}`} className="text-amber-500 font-medium hover:text-amber-600 mb-4 inline-block">
          &larr; Back to Shopper Profile
        </Link>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
          Request from {shopperProfile.full_name || 'Shopper'}
        </h1>
        <p className="text-slate-500 mt-1">
          This request will be sent directly to this shopper.
        </p>
      </div>

      <RequestForm categories={categories || []} shopperId={id} />
    </main>
  )
}
