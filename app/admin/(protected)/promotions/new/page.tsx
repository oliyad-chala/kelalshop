'use client'

import { createCampaign } from '@/lib/actions/campaigns'
import { CampaignForm } from '@/components/admin/promotions/CampaignForm'

export default function NewCampaignPage() {
  return <CampaignForm action={createCampaign} submitLabel="Launch Campaign" />
}
