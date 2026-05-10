import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const admin = createAdminClient()
  const [{ count: pendingVerifications }, { count: pendingPayments }] = await Promise.all([
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    admin.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <div className="admin-shell">
      {/* Auto-signs out after 30 minutes of inactivity */}
      <AdminInactivityGuard />
      <AdminSidebar
        user={profile as Profile}
        pendingVerifications={pendingVerifications ?? 0}
        pendingPayments={pendingPayments ?? 0}
      />
      <main className="admin-main fade-in">
        {/* Auto-generated breadcrumb — renders on pages deeper than /admin/dashboard */}
        <AdminBreadcrumb />
        {children}
      </main>
    </div>
  )
}
