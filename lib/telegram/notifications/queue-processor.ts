import { bot } from '../admin/bot'
import { customerBot } from '../customer/bot'
import { getTelegramSupabase } from '../core/supabase-admin'
import { telegramLog } from '../core/logger'
import { buildAdminMessage, buildCustomerMessage } from './templates'

const RETRY_DELAYS_MS = [0, 60_000, 300_000, 900_000]
const CIRCUIT_FAILURE_THRESHOLD = 5
const CIRCUIT_OPEN_MS = 120_000

async function isCircuitOpen(): Promise<boolean> {
  try {
    const supabase = getTelegramSupabase()
    const { data } = await supabase
      .from('telegram_circuit_breaker')
      .select('failure_count, opened_at')
      .eq('id', 'telegram_api')
      .maybeSingle()

    if (!data?.opened_at) return false
    const openedAt = new Date(data.opened_at).getTime()
    if (Date.now() - openedAt > CIRCUIT_OPEN_MS) {
      await supabase
        .from('telegram_circuit_breaker')
        .update({ failure_count: 0, opened_at: null, updated_at: new Date().toISOString() })
        .eq('id', 'telegram_api')
      return false
    }
    return (data.failure_count ?? 0) >= CIRCUIT_FAILURE_THRESHOLD
  } catch {
    return false
  }
}

async function recordTelegramFailure() {
  try {
    const supabase = getTelegramSupabase()
    const { data } = await supabase
      .from('telegram_circuit_breaker')
      .select('failure_count')
      .eq('id', 'telegram_api')
      .maybeSingle()

    const count = (data?.failure_count ?? 0) + 1
    await supabase
      .from('telegram_circuit_breaker')
      .update({
        failure_count: count,
        opened_at: count >= CIRCUIT_FAILURE_THRESHOLD ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'telegram_api')
  } catch {
    // ignore
  }
}

async function recordTelegramSuccess() {
  try {
    const supabase = getTelegramSupabase()
    await supabase
      .from('telegram_circuit_breaker')
      .update({ failure_count: 0, opened_at: null, updated_at: new Date().toISOString() })
      .eq('id', 'telegram_api')
  } catch {
    // ignore
  }
}

async function sendAdminMessage(chatId: number, text: string) {
  await bot.api.sendMessage(chatId, text, { parse_mode: 'HTML' })
}

async function sendCustomerMessage(chatId: number, text: string) {
  await customerBot.api.sendMessage(chatId, text, { parse_mode: 'HTML' })
}

export async function deliverAdminBroadcast(message: string) {
  const supabase = getTelegramSupabase()
  const { data: admins } = await supabase
    .from('telegram_admins')
    .select('telegram_chat_id')
    .eq('is_approved', true)

  if (!admins?.length) return

  for (const admin of admins) {
    try {
      await sendAdminMessage(admin.telegram_chat_id, message)
      await recordTelegramSuccess()
    } catch (e) {
      await recordTelegramFailure()
      telegramLog('telegram-notify', 'admin_send_failed', {
        chatId: admin.telegram_chat_id,
        error: String(e),
      }, 'error')
    }
  }
}

export async function processNotificationQueue(limit = 25): Promise<{ processed: number; failed: number }> {
  if (await isCircuitOpen()) {
    telegramLog('telegram-notify', 'circuit_breaker_open', {}, 'warn')
    return { processed: 0, failed: 0 }
  }

  const supabase = getTelegramSupabase()
  const now = new Date().toISOString()

  const { data: items, error } = await supabase
    .from('telegram_notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (error || !items?.length) return { processed: 0, failed: 0 }

  let processed = 0
  let failed = 0

  for (const item of items) {
    await supabase
      .from('telegram_notification_queue')
      .update({ status: 'processing' })
      .eq('id', item.id)

    try {
      if (item.channel === 'admin') {
        const text = buildAdminMessage(item.event_type, item.payload as Record<string, unknown>)
        await deliverAdminBroadcast(text)
      } else {
        const text = buildCustomerMessage(
          item.event_type as Parameters<typeof buildCustomerMessage>[0],
          item.payload as Record<string, unknown>
        )
        const payload = item.payload as Record<string, unknown>
        const targetProfileId = payload.targetProfileId as string | undefined

        if (targetProfileId) {
          const { data: user } = await supabase
            .from('telegram_users')
            .select('chat_id')
            .eq('profile_id', targetProfileId)
            .eq('is_verified', true)
            .maybeSingle()

          if (user?.chat_id) {
            await sendCustomerMessage(user.chat_id, text)
            await recordTelegramSuccess()
          }
        } else if (item.event_type === 'FLASH_SALE' || item.event_type === 'BROADCAST') {
          const { data: users } = await supabase
            .from('telegram_users')
            .select('chat_id')
            .eq('is_verified', true)

          for (const user of users ?? []) {
            try {
              await sendCustomerMessage(user.chat_id, text)
              await new Promise((r) => setTimeout(r, 35))
            } catch {
              await recordTelegramFailure()
            }
          }
        }
      }

      await supabase
        .from('telegram_notification_queue')
        .update({ status: 'sent', processed_at: new Date().toISOString() })
        .eq('id', item.id)
      processed++
    } catch (e) {
      const attempts = (item.attempts ?? 0) + 1
      const maxAttempts = item.max_attempts ?? 3
      const errMsg = String(e)

      if (attempts >= maxAttempts) {
        await supabase
          .from('telegram_notification_queue')
          .update({ status: 'failed', attempts, last_error: errMsg })
          .eq('id', item.id)

        await supabase.from('telegram_notification_dlq').insert({
          original_id: item.id,
          channel: item.channel,
          event_type: item.event_type,
          payload: item.payload,
          attempts,
          last_error: errMsg,
        })
      } else {
        const delay = RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length - 1)]
        await supabase
          .from('telegram_notification_queue')
          .update({
            status: 'pending',
            attempts,
            last_error: errMsg,
            scheduled_at: new Date(Date.now() + delay).toISOString(),
          })
          .eq('id', item.id)
      }
      await recordTelegramFailure()
      failed++
    }
  }

  return { processed, failed }
}

// Legacy direct send for backwards compatibility
export async function broadcastToAdmins(message: string) {
  await deliverAdminBroadcast(message)
}
