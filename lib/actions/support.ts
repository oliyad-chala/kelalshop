'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitSupportMessage(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to send a message.' }
  }

  const subject = formData.get('subject') as string
  const message = formData.get('message') as string

  if (!message || message.trim() === '') {
    return { error: 'Message cannot be empty.' }
  }

  // Find all admins and staff to receive the message
  const { data: adminProfiles, error: adminError } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'staff'])

  if (adminError || !adminProfiles || adminProfiles.length === 0) {
    console.error('Failed to find admin users:', adminError)
    return { error: 'Failed to send message: Support staff unavailable.' }
  }

  // Format the content
  const content = subject ? `[${subject}]\n\n${message}` : message

  const messagesToInsert = adminProfiles.map((admin) => ({
    sender_id: user.id,
    recipient_id: admin.id,
    content: content,
    is_read: false,
  }))

  const { error: insertError } = await supabase.from('messages').insert(messagesToInsert)

  if (insertError) {
    console.error('Error inserting support message:', insertError)
    return { error: 'Failed to send your message. Please try again later.' }
  }

  // Revalidate the admin notifications page so the new message shows up immediately
  revalidatePath('/admin/notifications')
  
  return { success: true }
}
