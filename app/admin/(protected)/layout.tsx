import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminInactivityGuard } from '@/components/admin/AdminInactivityGuard'
import { AdminShellClient } from '@/components/admin/AdminShellClient'
import { isAdminPortalRole } from '@/lib/utils/admin-roles'
import { getAdminAlertCounts, totalAlertCount } from '@/lib/data/admin-alerts'
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

  if (!isAdminPortalRole(profile?.role)) redirect('/admin/login')

  const admin = createAdminClient()
  const alerts = await getAdminAlertCounts(admin, user.id)

  // Filter alerts based on notification preferences
  if (profile?.notif_verifications === false) {
    alerts.pendingVerifications = 0
  }
  if (profile?.notif_payments === false) {
    alerts.pendingPayments = 0
  }
  if (profile?.notif_disputes === false) {
    alerts.openDisputes = 0
  }

  return (
    <>
      <AdminInactivityGuard sessionTimeout={profile?.session_timeout ?? 30} />
      <AdminShellClient
        user={profile as Profile}
        userRole={profile!.role}
        alerts={alerts}
        alertTotal={totalAlertCount(alerts)}
      >
        {children}
      </AdminShellClient>
    </>
  )
}
