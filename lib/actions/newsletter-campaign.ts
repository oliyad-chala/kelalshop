'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/email/resend'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { createClient } from '@/lib/supabase/server'

export async function getCampaigns() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) {
    return []
  }

  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching marketing campaigns:', error)
    return []
  }

  return data ?? []
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('marketing_campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting campaign:', error)
    return { error: error.message }
  }

  return { success: true }
}

export async function saveCampaign(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) {
    return { error: 'Unauthorized' }
  }

  const id = formData.get('id') as string | null
  const subject = formData.get('subject') as string
  const content = formData.get('content') as string
  const target_audience = formData.get('target_audience') as string
  const file = formData.get('image') as File | null

  if (!subject || !subject.trim()) return { error: 'Subject is required.' }
  if (!content || !content.trim()) return { error: 'Content is required.' }

  let image_url: string | null = formData.get('existing_image_url') as string | null

  // 1. Handle file upload if present
  if (file && file.size > 0 && file.name) {
    const MAX_BYTES = 5 * 1024 * 1024 // 5 MB limit
    if (file.size > MAX_BYTES) return { error: 'Image must be under 5 MB.' }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return { error: 'Please upload a valid image file.' }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`
    const filePath = `campaigns/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('marketing')
      .upload(filePath, file, { contentType: file.type })

    if (uploadError) {
      console.error('Storage upload failed:', uploadError)
      return { error: `Failed to upload image: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage.from('marketing').getPublicUrl(filePath)
    image_url = publicUrlData?.publicUrl || null
  }

  // 2. Save campaign record
  const payload = {
    subject,
    content,
    target_audience,
    image_url,
    created_by: user.id,
  }

  if (id) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return { error: error.message }
    }
    return { success: true, campaign: data }
  } else {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert({ ...payload, status: 'draft' })
      .select()
      .single()

    if (error) {
      console.error('Error inserting campaign:', error)
      return { error: error.message }
    }
    return { success: true, campaign: data }
  }
}

export async function sendCampaignAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) {
    return { error: 'Unauthorized' }
  }

  // Fetch campaign details
  const { data: campaign, error: fetchCampaignError } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchCampaignError || !campaign) {
    return { error: 'Campaign not found.' }
  }

  // Set status to sending
  await supabase
    .from('marketing_campaigns')
    .update({ status: 'sending', sent_at: new Date().toISOString() })
    .eq('id', id)

  const admin = createAdminClient()
  let emails: string[] = []

  try {
    if (campaign.target_audience === 'newsletter_subscribers') {
      const { data, error } = await admin.from('newsletter_subscribers').select('email')
      if (error) throw error
      emails = (data ?? []).map((e) => e.email)
    } else {
      const { data, error } = await admin.from('profiles').select('id')
      if (error) throw error
      const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 })
      if (authError) throw authError
      emails = (authUsers?.users ?? []).map((u) => u.email).filter(Boolean) as string[]
    }
  } catch (err: any) {
    console.error('Error fetching target list:', err)
    await supabase
      .from('marketing_campaigns')
      .update({ status: 'failed' })
      .eq('id', id)
    return { error: 'Failed to fetch email list from database.' }
  }

  if (emails.length === 0) {
    await supabase
      .from('marketing_campaigns')
      .update({ status: 'failed' })
      .eq('id', id)
    return { error: 'No subscribers found for this target.' }
  }

  let sentCount = 0
  let failedCount = 0

  for (const email of emails) {
    try {
      const imageTag = campaign.image_url
        ? `<div style="margin-bottom:24px;"><img src="${campaign.image_url}" alt="${campaign.subject}" style="width:100%;max-width:100%;height:auto;border-radius:12px;display:block;object-fit:cover;max-height:300px;" /></div>`
        : ''

      await sendTransactionalEmail({
        to: email,
        subject: campaign.subject,
        html: `
          <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:16px;border:1px solid #f1f5f9;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.05)">
            <div style="margin-bottom:24px;border-bottom:1px solid #f1f5f9;padding-bottom:16px">
              <span style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.025em">Kelal<span style="color:#f59e0b">Shop</span></span>
            </div>
            ${imageTag}
            <div style="font-size:16px;line-height:1.6;color:#334155;margin-bottom:32px">
              ${campaign.content.replace(/\n/g, '<br />')}
            </div>
            <div style="padding-top:24px;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5">
              You are receiving this email because you registered on KelalShop or subscribed to our newsletter.<br />
              Addis Ababa, Ethiopia · © ${new Date().getFullYear()} KelalShop
            </div>
          </div>
        `,
      })
      sentCount++
    } catch (err) {
      console.error(`Failed to send campaign email to ${email}:`, err)
      failedCount++
    }
  }

  // Update final status
  const finalStatus = sentCount > 0 ? 'sent' : 'failed'
  const { data: updatedCampaign } = await supabase
    .from('marketing_campaigns')
    .update({
      status: finalStatus,
      sent_count: sentCount,
      failed_count: failedCount,
    })
    .eq('id', id)
    .select()
    .single()

  return { success: true, campaign: updatedCampaign }
}
