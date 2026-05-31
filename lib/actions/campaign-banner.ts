'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function uploadCampaignBanner(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('banner_file') as File | null
  if (!file || file.size === 0) {
    return { error: 'No file selected.' }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Use JPEG, PNG, WebP, or GIF.' }
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Image must be 5 MB or smaller.' }
  }

  const admin = createAdminClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `campaigns/${crypto.randomUUID()}.${ext}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from('products')
    .upload(fileName, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  const { data } = admin.storage.from('products').getPublicUrl(fileName)
  return { url: data.publicUrl }
}
