import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import type { Profile } from '@/types/app.types'

/**
 * Protected admin layout — wraps all admin pages except /admin/login.
 * Performs a server-side role check on every request; middleware is the first line
 * of defence but this double-checks at the React layer.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/admin/login')

  return (
    <div className="admin-shell">
      <AdminSidebar user={profile as Profile} />
      <main className="admin-main fade-in">{children}</main>
    </div>
  )
}
