import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'
import { isAdminRole } from '@/lib/utils/admin-roles'

import { getPlatformSettings } from '@/lib/actions/admin-settings'

export const metadata = { title: 'Settings' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) redirect('/admin/dashboard')

  const { maintenanceMode } = await getPlatformSettings()

  return <SettingsClient profile={profile} email={user.email ?? ''} initialMaintenanceMode={maintenanceMode} />
}
