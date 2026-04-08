'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/types/app.types'

export async function sendMessage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const order_id = formData.get('order_id') as string
  const content = formData.get('content') as string

  if (!content || !content.trim()) return { error: 'Message cannot be empty.' }
  if (!order_id) return { error: 'Order ID is missing.' }

  const { error } = await supabase
    .from('messages')
    .insert({
      order_id,
      sender_id: user.id,
      content,
    })

  if (error) return { error: error.message }

  // The client side realtime hook handles triggering the UI refresh natively,
  // but we run revalidatePath just to ensure server cache hits are updated.
  revalidatePath(`/dashboard/chat/${order_id}`)
  
  return { success: 'Sent' } // success state can clear form naturally
}
