'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/types/app.types'

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const full_name = formData.get('full_name') as string
  const location = formData.get('location') as string
  const phone = formData.get('phone') as string
  const bio = formData.get('bio') as string // shopper only
  const business_name = formData.get('business_name') as string // shopper only

  if (!full_name) return { error: 'Full name is required.' }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name,
      phone: phone || null,
      location: location || null,
    } as any)
    .eq('id', user.id)
  if (profileError) return { error: profileError.message }

  // Check if shopper to update shopper_profiles
  if (bio !== null || business_name !== null) {
      const { error: shopperError } = await supabase
        .from('shopper_profiles')
        .update({
        business_name: business_name || null,
        bio: bio || null,
      } as any)
      .eq('id', user.id)
      if (shopperError) return { error: shopperError.message }
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
  
  return { success: 'Profile updated successfully.' }
}
