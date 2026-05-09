import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutForm } from '@/components/cart/CheckoutForm'
import Link from 'next/link'

export const metadata = {
  title: 'Checkout | KelalShop',
}

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/checkout')
  }

  return (
    <main className="flex-1 bg-slate-50 py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-navy-900">Home</Link>
          <span>/</span>
          <span className="text-navy-900 font-medium">Checkout</span>
        </nav>

        <h1 className="text-2xl font-bold text-navy-900 tracking-tight mb-8">
          Checkout
        </h1>

        <CheckoutForm />
      </div>
    </main>
  )
}
