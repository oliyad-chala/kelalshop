import { createAdminClient } from '@/lib/supabase/admin'
import { queueEmail } from './queue'

/**
 * Returns a list of unique admin email addresses configured to receive platform alerts.
 * Aggregates from environment variables, database admin profiles, platform settings,
 * and built-in administrator addresses.
 */
export async function getAdminNotificationRecipients(): Promise<string[]> {
  const recipients = new Set<string>()

  // 1. Environment variables
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    process.env.ADMIN_NOTIFICATION_EMAIL.split(',').forEach((email) => {
      const clean = email.trim().toLowerCase()
      if (clean && clean.includes('@')) recipients.add(clean)
    })
  }

  if (process.env.ADMIN_EMAIL) {
    process.env.ADMIN_EMAIL.split(',').forEach((email) => {
      const clean = email.trim().toLowerCase()
      if (clean && clean.includes('@')) recipients.add(clean)
    })
  }

  // 2. Database admin profiles & settings
  try {
    const adminClient = createAdminClient()

    // Check platform settings support/admin email
    const { data: settings } = await adminClient
      .from('platform_settings')
      .select('support_email')
      .maybeSingle()

    if (settings?.support_email) {
      const clean = settings.support_email.trim().toLowerCase()
      if (clean && clean.includes('@') && !clean.includes('example.com')) {
        recipients.add(clean)
      }
    }

    // Check users with role = 'admin' in profiles
    const { data: adminProfiles } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (adminProfiles && adminProfiles.length > 0) {
      const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 100 })
      if (authData?.users) {
        const adminIdSet = new Set(adminProfiles.map((p) => p.id))
        for (const user of authData.users) {
          if (adminIdSet.has(user.id) && user.email) {
            const clean = user.email.trim().toLowerCase()
            if (clean && clean.includes('@')) {
              recipients.add(clean)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[Admin Email] Error querying admin profiles:', err)
  }

  // 3. Fallbacks to ensure alerts are never lost
  if (recipients.size === 0) {
    recipients.add('oliyadchala24@gmail.com')
    recipients.add('olaccc24@gmail.com')
  }

  return Array.from(recipients)
}

export interface AdminNotificationOptions {
  type: string
  subject: string
  html: string
  text?: string
  idempotencyPrefix: string
}

/**
 * Dispatches a transactional email to all platform administrators with idempotency protection.
 * Safe to call from Server Actions; errors are logged without throwing to prevent user flows from breaking.
 */
export async function sendAdminNotificationEmail(options: AdminNotificationOptions): Promise<void> {
  try {
    const recipients = await getAdminNotificationRecipients()
    if (recipients.length === 0) {
      console.warn('[Admin Notification Email] No recipient addresses found.')
      return
    }

    await Promise.allSettled(
      recipients.map(async (recipient) => {
        const safeRecipientKey = recipient.replace(/[^a-zA-Z0-9]/g, '_')
        const idempotencyKey = `${options.idempotencyPrefix}-${safeRecipientKey}`

        try {
          await queueEmail(
            options.type,
            {
              to: recipient,
              subject: options.subject,
              html: options.html,
              text: options.text,
            },
            idempotencyKey
          )
        } catch (err) {
          console.error(`[Admin Notification Email] Failed to send to ${recipient}:`, err)
        }
      })
    )
  } catch (err) {
    console.error('[Admin Notification Email] Unexpected error dispatching notifications:', err)
  }
}
