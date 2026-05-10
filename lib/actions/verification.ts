'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function submitVerification(
  formData: FormData
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  // The file is now uploaded client-side from the browser directly to Supabase Storage.
  // We only receive the resulting storage path + form data here.
  const storagePath   = (formData.get('storage_path') as string | null)?.trim() ?? ''
  const phone         = (formData.get('phone') as string | null)?.trim() ?? ''
  const agreedToTerms = formData.get('agreed_to_terms') === 'true'

  if (!storagePath) throw new Error('No document path received. Please re-upload your ID.')
  if (!phone) throw new Error('Please enter your phone number.')
  if (!agreedToTerms) throw new Error('You must agree to the Seller Contract before submitting.')

  // Check current verification status via service-role client to bypass RLS
  const admin = createAdminClient()
  const { data: shopper } = await admin
    .from('shopper_profiles')
    .select('verification_status')
    .eq('id', user.id)
    .single()

  if (!shopper) throw new Error('Shopper profile not found.')
  if (shopper.verification_status === 'verified') throw new Error('Already verified.')
  if (shopper.verification_status === 'pending') throw new Error('Verification already pending review.')

  // Store the storage path in id_document_url field so the admin extractStoragePath() still works
  // The admin page generates fresh 1-hour signed URLs from this path on every load
  const documentRef = storagePath

  await supabase
    .from('profiles')
    .update({ phone } as any)
    .eq('id', user.id)

  const { error: updateError } = await admin
    .from('shopper_profiles')
    .update({
      verification_status: 'pending',
      id_document_url: documentRef,
    } as any)
    .eq('id', user.id)

  if (updateError) throw new Error(updateError.message)

  revalidatePath('/dashboard/verification')
  revalidatePath('/dashboard')
  redirect('/dashboard/verification')
}
