import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductsTable } from '@/components/admin/ProductsTable'

export const metadata = { title: 'Product Moderation' }

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data } = await admin
    .from('products')
    .select(`
      id, name, price, stock, is_available, created_at,
      profiles!products_shopper_id_fkey(full_name),
      categories(name)
    `)
    .order('created_at', { ascending: false })

  const rows = (data ?? []).map((p: any) => ({
    id:          p.id,
    name:        p.name,
    shopperName: p.profiles?.full_name ?? '—',
    price:       p.price,
    stock:       p.stock,
    category:    p.categories?.name ?? 'Uncategorised',
    is_available: p.is_available,
    created_at:  p.created_at,
  }))

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Product Moderation</h1>
          <p className="section-subtitle">Toggle availability to hide listings that violate marketplace terms</p>
        </div>
        <span className="admin-badge badge-default">{rows.length} products</span>
      </div>

      <ProductsTable rows={rows} />
    </div>
  )
}
