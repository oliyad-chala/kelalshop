import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from './resend'

export interface QueueEmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

const MAX_RETRIES = 3
const BACKOFF_FACTORS = [1000, 3000, 9000] // 1s, 3s, 9s

/**
 * Queues an email for sending, handles deduplication via idempotency key,
 * and executes with exponential backoff retry logic.
 */
export async function queueEmail(
  type: string,
  payload: QueueEmailPayload,
  idempotencyKey: string
): Promise<{ sent: boolean; resendId?: string; error?: string }> {
  const supabase = createAdminClient()

  // 1. Check for deduplication
  const { data: existingLog, error: fetchError } = await supabase
    .from('email_log')
    .select('id, status, resend_id, error')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  if (fetchError) {
    console.error('[Email Queue] Error checking idempotency:', fetchError)
  }

  if (existingLog) {
    if (existingLog.status === 'sent') {
      console.log(`[Email Queue] Email already sent (deduplicated). Key: ${idempotencyKey}`)
      return { sent: true, resendId: existingLog.resend_id }
    }
    if (existingLog.status === 'pending') {
      console.log(`[Email Queue] Email is already pending/sending. Key: ${idempotencyKey}`)
      return { sent: false, error: 'Email currently pending' }
    }
  }

  // 2. Insert or update the log entry as pending
  const recipientString = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to
  
  let logId = existingLog?.id
  if (!logId) {
    const { data: insertedLog, error: insertError } = await supabase
      .from('email_log')
      .insert({
        idempotency_key: idempotencyKey,
        type,
        recipient: recipientString,
        subject: payload.subject,
        status: 'pending',
        attempt_count: 0,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[Email Queue] Failed to insert email log:', insertError)
      // Fallback: send directly if DB logging fails, to prevent blocking critical flows
      try {
        const resendRes = await sendTransactionalEmail(payload)
        return { sent: true, resendId: resendRes?.id }
      } catch (err: any) {
        return { sent: false, error: err?.message || 'DB insert failed and send failed' }
      }
    }
    logId = insertedLog.id
  }

  // 3. Attempt to send with retry logic
  let attempt = 0
  let resendId: string | undefined
  let lastError: any = null

  while (attempt < MAX_RETRIES) {
    attempt++
    try {
      // Update attempt count in DB
      await supabase
        .from('email_log')
        .update({ attempt_count: attempt })
        .eq('id', logId)

      const resendRes = await sendTransactionalEmail(payload)
      resendId = resendRes?.id
      break // Success!
    } catch (err: any) {
      lastError = err
      console.warn(`[Email Queue] Attempt ${attempt} failed for key ${idempotencyKey}:`, err?.message || err)
      
      if (attempt < MAX_RETRIES) {
        const delay = BACKOFF_FACTORS[attempt - 1] ?? 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // 4. Update final status in DB
  if (resendId) {
    await supabase
      .from('email_log')
      .update({
        status: 'sent',
        resend_id: resendId,
        sent_at: new Date().toISOString(),
        error: null,
      })
      .eq('id', logId)

    return { sent: true, resendId }
  } else {
    const errorMsg = lastError?.message || String(lastError)
    await supabase
      .from('email_log')
      .update({
        status: 'failed',
        error: errorMsg,
      })
      .eq('id', logId)

    return { sent: false, error: errorMsg }
  }
}
