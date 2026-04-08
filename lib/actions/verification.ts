'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/types/app.types'

export async function submitVerification(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const file = formData.get('id_document') as File | null

  if (!file || file.size === 0) {
    return { error: 'Please upload an ID document.' }
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

  // Ensure user is shopper and unverified or rejected
  const { data: shopper } = await supabase
    .from('shopper_profiles')
    .select('verification_status')
    .eq('id', user.id)
    .single()

  if (!shopper) return { error: 'Shopper profile not found.' }
  if (shopper.verification_status === 'verified') return { error: 'Already verified.' }
  if (shopper.verification_status === 'pending') return { error: 'Verification already pending.' }

  // Upload to secure bucket (this bucket should have restricted RLS reading)
  const { error: uploadError } = await supabase.storage
    .from('verifications')
    .upload(fileName, file)

  if (uploadError) return { error: uploadError.message }

  // Update status
  const { error: updateError } = await supabase
    .from('shopper_profiles')
    .update({ verification_status: 'pending' })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard/verification')
  revalidatePath('/dashboard')
  
  return { success: 'Verification documents submitted successfully.' }
}
