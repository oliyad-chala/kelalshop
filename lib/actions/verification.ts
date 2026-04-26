'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function submitVerification(
  formData: FormData
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const file          = formData.get('id_document') as File | null
  const phone         = (formData.get('phone') as string | null)?.trim() ?? ''
  const agreedToTerms = formData.get('agreed_to_terms') === 'true'

  if (!file || file.size === 0) throw new Error('Please upload an ID document.')
  if (file.size > 5 * 1024 * 1024) throw new Error('ID document exceeds the 5 MB size limit.')
  if (!phone) throw new Error('Please enter your phone number.')
  if (!agreedToTerms) throw new Error('You must agree to the Seller Contract before submitting.')

  const { data: shopper } = await supabase
    .from('shopper_profiles')
    .select('verification_status')
    .eq('id', user.id)
    .single()

  if (!shopper) throw new Error('Shopper profile not found.')
  if (shopper.verification_status === 'verified') throw new Error('Already verified.')
  if (shopper.verification_status === 'pending') throw new Error('Verification already pending review.')

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('id-documents')
    .upload(fileName, fileBuffer, {
      contentType: file.type,
      upsert: true
    })

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data: urlData } = supabase.storage
    .from('id-documents')
    .getPublicUrl(fileName)

  await supabase
    .from('profiles')
    .update({ phone } as any)
    .eq('id', user.id)

  const { error: updateError } = await supabase
    .from('shopper_profiles')
    .update({
      verification_status: 'pending',
      id_document_url: urlData.publicUrl,
    } as any)
    .eq('id', user.id)

  if (updateError) throw new Error(updateError.message)

  revalidatePath('/dashboard/verification')
  revalidatePath('/dashboard')
  redirect('/dashboard/verification')
}
