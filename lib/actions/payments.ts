'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/types/app.types'

export async function submitPaymentRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const paymentType = formData.get('payment_type') as string
  const targetId = formData.get('target_id') as string | null
  const receiptFile = formData.get('receipt') as File | null

  if (!paymentType || !receiptFile || receiptFile.size === 0) {
    return { error: 'Payment type and receipt image are required.' }
  }

  // Determine amount based on type
  let amount = 0
  if (paymentType === 'pro_subscription') amount = 1000
  else if (paymentType === 'boost_7_days') amount = 300
  else if (paymentType === 'boost_28_days') amount = 3000
  else if (paymentType === 'banner_ad') amount = 5000 // Placeholder
  else return { error: 'Invalid payment type selected.' }

  // Upload receipt
  const fileExt = receiptFile.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(fileName, receiptFile)

  if (uploadError) {
    console.error('Failed to upload receipt:', uploadError)
    return { error: 'Failed to upload receipt image. Please try again.' }
  }

  const { data: publicUrlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(uploadData.path)

  const receiptUrl = publicUrlData.publicUrl

  const { error } = await supabase.from('payment_requests').insert({
    shopper_id: user.id,
    payment_type: paymentType,
    target_id: targetId || null,
    amount,
    receipt_url: receiptUrl,
    status: 'pending',
  } as any)

  if (error) {
    console.error('Failed to submit payment request:', error)
    return { error: 'Failed to submit request. Please try again.' }
  }

  revalidatePath('/dashboard/billing')
  return { success: 'Your payment request has been submitted for verification. We will review it shortly!' }
}

