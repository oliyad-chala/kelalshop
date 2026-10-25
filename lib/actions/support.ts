'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { queueEmail } from '@/lib/email/queue'
import { buildSupportContactInquiryEmail } from '@/lib/email/templates'

export async function submitSupportMessage(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const firstName = (formData.get('first_name') as string)?.trim() || ''
  const lastName = (formData.get('last_name') as string)?.trim() || ''
  const formEmail = (formData.get('email') as string)?.trim() || ''
  const subject = (formData.get('subject') as string)?.trim() || 'General Inquiry'
  const message = (formData.get('message') as string)?.trim() || ''

  if (!message) {
    return { error: 'Message cannot be empty.' }
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'oliyadchala24@gmail.com'

  // If user is a guest (not logged in)
  if (!user) {
    if (!formEmail) {
      return { error: 'Please enter your email address so we can reply.' }
    }

    try {
      const senderName = `${firstName} ${lastName}`.trim() || 'Guest Visitor'
      const emailData = buildSupportContactInquiryEmail({
        senderName,
        senderEmail: formEmail,
        subject,
        message,
        userId: null,
      })

      await queueEmail(
        'support-contact-inquiry-guest',
        {
          to: adminEmail,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        },
        `guest-inquiry-${Date.now()}`
      )

      return { success: true }
    } catch (err: any) {
      console.error('[Guest Support Message] Error:', err)
      return { error: 'Failed to send message. Please try again.' }
    }
  }

  // If user is logged in:
  // Find all admins and staff to receive the message in their inboxes
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

  // Get sender's name from profile or metadata
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const senderName = `${firstName} ${lastName}`.trim() || userProfile?.full_name || user.user_metadata?.full_name || 'Customer'
  const senderEmail = formEmail || user.email || 'No email provided'

  // Send email alert to admin
  try {
    const emailData = buildSupportContactInquiryEmail({
      senderName,
      senderEmail,
      subject,
      message,
      userId: user.id,
    })

    await queueEmail(
      'support-contact-inquiry',
      {
        to: adminEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      },
      `support-inquiry-${user.id}-${Date.now()}`
    )
  } catch (emailErr) {
    console.error('[Support Message] Failed to dispatch admin email:', emailErr)
    // Non-blocking: database message has already been recorded
  }

  // Revalidate the admin notifications & support page so the new message shows up immediately
  revalidatePath('/admin/support')
  revalidatePath('/admin/notifications')
  
  return { success: true }
}
