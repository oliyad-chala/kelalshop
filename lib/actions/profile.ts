'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logUserAction } from '@/lib/actions/activity-log'
import type { ActionState } from '@/types/app.types'

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const full_name = (formData.get('full_name') as string)?.trim()
  const location = (formData.get('location') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const bio = formData.get('bio') as string | null
  const business_name = formData.get('business_name') as string | null
  const delivery_time_days = formData.get('delivery_time_days') as string | null

  if (!full_name) return { error: 'Full name is required.' }
  if (/\d/.test(full_name)) return { error: 'Full name must not contain numbers.' }

  // 1. Update the base profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name,
      phone: phone || null,
      location: location || null,
    } as any)
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  // 2. Check role — only upsert shopper_profiles if user is a shopper
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'shopper') {
    const { error: shopperError } = await supabase
      .from('shopper_profiles')
      .upsert({
        id: user.id,
        business_name: business_name?.trim() || null,
        bio: bio?.trim() || null,
        ...(delivery_time_days ? { delivery_time_days: parseInt(delivery_time_days) } : {}),
      } as any, { onConflict: 'id' })

    if (shopperError) return { error: shopperError.message }
  }

  // 3. Log the profile update
  await logUserAction({
    userId: user.id,
    userName: full_name,
    actionType: 'update_profile',
    entityType: 'profile',
    entityId: user.id,
    description: `Updated profile information`,
  })

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')

  return { success: 'Profile updated successfully.' }
}

export async function uploadAvatar(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const file = formData.get('avatar') as File
  if (!file || file.size === 0) return { error: 'No file selected.' }

  const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
  if (file.size > MAX_BYTES) return { error: 'Avatar must be under 2 MB.' }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Please upload a JPEG, PNG, WebP, or GIF image.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `avatars/${user.id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl } as any)
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')

  return { success: 'Avatar updated successfully.' }
}
