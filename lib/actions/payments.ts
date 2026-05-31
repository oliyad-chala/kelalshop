'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/types/app.types'

const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024

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

  if (receiptFile.size > MAX_RECEIPT_BYTES) {
    return { error: 'Receipt image must be 5 MB or smaller.' }
  }

  if (!ALLOWED_RECEIPT_TYPES.includes(receiptFile.type)) {
    return { error: 'Receipt must be a JPEG, PNG, or WebP image.' }
  }

  let amount = 0
  if (paymentType === 'pro_subscription') amount = 1000
  else if (paymentType === 'boost_7_days') amount = 300
  else if (paymentType === 'boost_28_days') amount = 3000
  else if (paymentType === 'banner_ad') amount = 5000
  else return { error: 'Invalid payment type selected.' }

  const ext = receiptFile.type === 'image/png' ? 'png' : receiptFile.type === 'image/webp' ? 'webp' : 'jpg'
  const storagePath = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(storagePath, receiptFile, { contentType: receiptFile.type, upsert: false })

  if (uploadError) {
    console.error('Failed to upload receipt:', uploadError)
    return { error: 'Failed to upload receipt image. Please try again.' }
  }

  const { error } = await supabase.from('payment_requests').insert({
    shopper_id: user.id,
    payment_type: paymentType,
    target_id: targetId || null,
    amount,
    receipt_url: storagePath,
    status: 'pending',
  } as any)

  if (error) {
    console.error('Failed to submit payment request:', error)
    return { error: 'Failed to submit request. Please try again.' }
  }

  revalidatePath('/dashboard/billing')
  return { success: 'Your payment request has been submitted for verification. We will review it shortly!' }
}
