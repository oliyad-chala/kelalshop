import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RequestForm } from '@/components/requests/RequestForm'

export const metadata = {
  title: 'New Request | KelalShop',
}

export default async function NewRequestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Ensure user is a buyer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'shopper') {
    // Shoppers cannot make requests, they fulfill them
    redirect('/dashboard/requests')
  }

  // Fetch categories for the select dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Post a Request</h1>
        <p className="text-slate-500 mt-1">
          Tell shoppers what you want to buy, and they will give you a quote.
        </p>
      </div>

      <RequestForm categories={categories || []} />
    </div>
  )
}
