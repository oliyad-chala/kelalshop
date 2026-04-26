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
  const file = formData.get('image') as File | null

  if (!order_id) return { error: 'Order ID is missing.' }
  if ((!content || !content.trim()) && (!file || file.size === 0)) {
    return { error: 'Message cannot be empty.' }
  }

  let image_url = null

  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'Image exceeds 5 MB limit.' }
    }
    const fileExt = file.name.split('.').pop()
    const fileName = `${order_id}/${crypto.randomUUID()}.${fileExt}`
    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('messages')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) return { error: `Upload failed: ${uploadError.message}` }

    const { data: urlData } = supabase.storage
      .from('messages')
      .getPublicUrl(fileName)
    
    image_url = urlData.publicUrl
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      order_id,
      sender_id: user.id,
      content: content || 'Sent an attachment',
      image_url,
    })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/chat/${order_id}`)
  
  return { success: 'Sent' }
}
