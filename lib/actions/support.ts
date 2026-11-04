'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { buildSupportContactInquiryEmail } from '@/lib/email/templates'
import { sendAdminNotificationEmail } from '@/lib/email/admin'

export async function submitSupportMessage(prevState: any, formData: FormData) {
  let user: any = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  const firstName = (formData.get('first_name') as string)?.trim() || ''
  const lastName = (formData.get('last_name') as string)?.trim() || ''
  const formEmail = (formData.get('email') as string)?.trim() || ''
  const subject = (formData.get('subject') as string)?.trim() || 'General Inquiry'
  const message = (formData.get('message') as string)?.trim() || ''

  if (!message) {
    return { error: 'Message cannot be empty.' }
  }

  const admin = createAdminClient()

  let senderUserId: string
  let senderName: string
  let senderEmail: string

  if (user) {
    senderUserId = user.id
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    senderName = `${firstName} ${lastName}`.trim() || userProfile?.full_name || user.user_metadata?.full_name || 'Customer'
    senderEmail = formEmail || user.email || 'No email provided'
  } else {
    // Guest visitor submission
    if (!formEmail) {
      return { error: 'Please enter your email address so we can reply.' }
    }

    senderName = `${firstName} ${lastName}`.trim() || 'Guest Visitor'
    senderEmail = formEmail

    try {
      // Check if an existing auth user matches this email
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const existingUser = authData?.users?.find(
        (u) => u.email?.toLowerCase() === formEmail.toLowerCase()
      )

      if (existingUser) {
        senderUserId = existingUser.id
      } else {
        // Create an unauthenticated/confirmed customer user account
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: formEmail,
          email_confirm: true,
          user_metadata: { full_name: senderName },
        })
        if (createError || !newUser?.user) {
          console.error('[Guest Support Message] Failed to create auth user:', createError)
          return { error: 'Failed to process inquiry. Please try again.' }
        }
        senderUserId = newUser.user.id
      }

      // Ensure profile exists in profiles table
      await admin.from('profiles').upsert({
        id: senderUserId,
        full_name: senderName,
        role: 'buyer',
        updated_at: new Date().toISOString(),
      })
    } catch (err: any) {
      console.error('[Guest Support Message] Error resolving user profile:', err)
      return { error: 'Failed to send message. Please try again.' }
    }
  }

  // Find all admins and staff to receive the message in their inboxes
  const { data: adminProfiles, error: adminError } = await admin
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'staff'])

  if (adminError || !adminProfiles || adminProfiles.length === 0) {
    console.error('Failed to find admin users:', adminError)
    return { error: 'Failed to send message: Support staff unavailable.' }
  }

  // Format the content
  const content = subject ? `[${subject}]\n\n${message}` : message

  const messagesToInsert = adminProfiles.map((adminMember) => ({
    sender_id: senderUserId,
    recipient_id: adminMember.id,
    content: content,
    is_read: false,
  }))

  const { error: insertError } = await admin.from('messages').insert(messagesToInsert)

  if (insertError) {
    console.error('Error inserting support message:', insertError)
    return { error: 'Failed to send your message. Please try again later.' }
  }

  // Send email alert to admins
  try {
    const emailData = buildSupportContactInquiryEmail({
      senderName,
      senderEmail,
      subject,
      message,
      userId: senderUserId,
    })

    await sendAdminNotificationEmail({
      type: 'support-contact-inquiry',
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      idempotencyPrefix: `support-inquiry-${senderUserId}-${Date.now()}`,
    })
  } catch (emailErr) {
    console.error('[Support Message] Failed to dispatch admin email:', emailErr)
  }

  // Revalidate the admin notifications & support page so the new message shows up immediately
  try {
    revalidatePath('/admin/support')
    revalidatePath('/admin/notifications')
  } catch {
    // Outside Next.js request context (e.g. background job/testing)
  }

  return { success: true }
}
