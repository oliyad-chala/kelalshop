import { redirect } from 'next/navigation'
import { listStaff } from '@/lib/actions/admin-staff'
import { StaffManagementClient } from '@/components/admin/StaffManagementClient'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Staff Management' }

export default async function AdminStaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) redirect('/admin/dashboard')

  const staff = await listStaff()

  return <StaffManagementClient initialStaff={staff} />
}
