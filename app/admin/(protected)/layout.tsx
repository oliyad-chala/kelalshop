import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminInactivityGuard } from '@/components/admin/AdminInactivityGuard'
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb'
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
      {/* Auto-signs out after 30 minutes of inactivity */}
      <AdminInactivityGuard />
      <AdminSidebar user={profile as Profile} />
      <main className="admin-main fade-in">
        {/* Auto-generated breadcrumb — renders on pages deeper than /admin/dashboard */}
        <AdminBreadcrumb />
        {children}
      </main>
    </div>
  )
}
