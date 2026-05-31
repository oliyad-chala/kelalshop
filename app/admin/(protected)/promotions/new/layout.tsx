import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/utils/admin-roles'

export default async function NewCampaignLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) redirect('/admin/dashboard')

  return children
}
