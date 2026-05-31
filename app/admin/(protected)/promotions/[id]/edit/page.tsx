import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { updateCampaign } from '@/lib/actions/campaigns'
import { CampaignForm } from '@/components/admin/promotions/CampaignForm'

interface Props { params: Promise<{ id: string }> }

export default async function EditCampaignPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) redirect('/admin/dashboard')

  const admin = createAdminClient()
  const { data: campaign } = await admin.from('promotions').select('*').eq('id', id).single()
  if (!campaign) notFound()

  const boundAction = updateCampaign.bind(null, id)

  return <CampaignForm action={boundAction} submitLabel="Save Changes" campaign={campaign} />
}
