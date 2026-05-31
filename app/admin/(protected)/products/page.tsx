import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductDataTable } from '@/components/admin/products/ProductDataTable'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { PackageSearch } from 'lucide-react'

export const metadata = { title: 'Product Moderation' }

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const canManage = isAdminRole(profile?.role)

  const admin = createAdminClient()

  const { data } = await admin
    .from('products')
    .select(`
      id, name, price, stock, is_available, created_at, is_featured, boosted_until,
      approval_status, approval_notes,
      profiles!products_shopper_id_fkey(full_name),
      categories(name)
    `)
    .order('created_at', { ascending: false })

  const rows = (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    shopperName: p.profiles?.full_name ?? '—',
    price: p.price,
    stock: p.stock,
    category: p.categories?.name ?? 'Uncategorised',
    is_available: p.is_available,
    is_featured: p.is_featured,
    boosted_until: p.boosted_until,
    created_at: p.created_at,
    approval_status: p.approval_status,
    approval_notes: p.approval_notes,
  }))

  const activeCount = rows.filter((r: any) => r.is_available && r.approval_status === 'approved').length
  const pendingCount = rows.filter((r: any) => r.approval_status === 'pending').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Product Moderation</h1>
          <p className="section-subtitle">Manage all products, categories, and remove listings that violate terms</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="admin-badge badge-warning">{pendingCount} Pending</span>
          <span className="admin-badge badge-verified">{activeCount} Active</span>
          <span className="admin-badge badge-default">{rows.length} Total</span>
        </div>
      </div>

      <ProductDataTable rows={rows} canManage={canManage} />
    </div>
  )
}
