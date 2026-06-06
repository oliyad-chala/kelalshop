import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { getUsers } from '@/lib/actions/admin-users'
import { UsersDataTable } from '@/components/admin/users/UsersDataTable'
import { Users } from 'lucide-react'

export const metadata = { title: 'User Management' }

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ role?: string, search?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) redirect('/admin/dashboard')

  const resolvedParams = await searchParams
  const roleFilter = resolvedParams.role || 'all'
  const searchQuery = resolvedParams.search || ''

  const { users, count } = await getUsers(1, roleFilter, searchQuery)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} color="var(--color-accent-600)" />
            User Management
          </h1>
          <p className="section-subtitle">View and manage all buyers and sellers on the platform.</p>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <a 
          href="/admin/users?role=all"
          className={`admin-btn ${roleFilter === 'all' ? 'admin-btn-primary' : ''}`}
        >
          All Users
        </a>
        <a 
          href="/admin/users?role=buyer"
          className={`admin-btn ${roleFilter === 'buyer' ? 'admin-btn-primary' : ''}`}
        >
          Buyers
        </a>
        <a 
          href="/admin/users?role=shopper"
          className={`admin-btn ${roleFilter === 'shopper' ? 'admin-btn-primary' : ''}`}
        >
          Sellers
        </a>
      </div>

      <UsersDataTable initialUsers={users} initialCount={count} />
    </div>
  )
}
