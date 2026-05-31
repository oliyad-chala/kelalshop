import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminInactivityGuard } from '@/components/admin/AdminInactivityGuard'
import { AdminShellClient } from '@/components/admin/AdminShellClient'
import { isAdminPortalRole } from '@/lib/utils/admin-roles'
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
  const [
    { count: pendingVerifications },
    { count: pendingPayments },
    { count: pendingCampaignReviews },
  ] = await Promise.all([
    admin.from('shopper_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    admin.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('promotion_products').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <>
      <AdminInactivityGuard />
      <AdminShellClient
        user={profile as Profile}
        userRole={profile!.role}
        pendingVerifications={pendingVerifications ?? 0}
        pendingPayments={pendingPayments ?? 0}
        pendingCampaignReviews={pendingCampaignReviews ?? 0}
      >
        {children}
      </AdminShellClient>
    </>
  )
}
