import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { OrderDetailClient } from './OrderDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: `Order #${id.split('-')[0].toUpperCase()}` }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: order, error } = await admin
    .from('orders')
    .select(`
      id, amount, shipping_fee, shipping_discount, shipping_promotion_id,
      status, created_at, updated_at,
      products(id, name, price, product_images(url)),
      buyer:profiles!orders_buyer_id_fkey(id, full_name, phone),
      shopper:profiles!orders_shopper_id_fkey(id, full_name, phone)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching order detail page:', error)
  }

  if (!order) notFound()

  return <OrderDetailClient order={order} />
}
