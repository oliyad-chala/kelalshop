import { getTelegramSupabase } from './supabase-admin'
import { telegramLog } from './logger'

const WINDOW_MS = 60_000
const MAX_COMMANDS_PER_WINDOW = 30

const memoryBuckets = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(chatId: number, action = 'command'): Promise<boolean> {
  const key = `${chatId}:${action}`
  const now = Date.now()

  const mem = memoryBuckets.get(key)
  if (!mem || now > mem.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (mem.count >= MAX_COMMANDS_PER_WINDOW) {
    telegramLog('telegram-admin', 'rate_limit_exceeded', { chatId, action }, 'security')
    return false
  }
  mem.count++
  return true
}

export async function checkOtpRateLimit(chatId: number): Promise<boolean> {
  const key = `otp:${chatId}`
  const now = Date.now()
  const OTP_MAX = 5
  const OTP_WINDOW = 3_600_000

  try {
    const supabase = getTelegramSupabase()
    const { data } = await supabase
      .from('rate_limits')
      .select('requests, expires_at')
      .eq('identifier', key)
      .maybeSingle()

    if (data && new Date(data.expires_at).getTime() > now) {
      if (data.requests >= OTP_MAX) return false
      await supabase
        .from('rate_limits')
        .update({ requests: data.requests + 1 })
        .eq('identifier', key)
      return true
    }

    await supabase.from('rate_limits').upsert({
      identifier: key,
      requests: 1,
      expires_at: new Date(now + OTP_WINDOW).toISOString(),
    })
    return true
  } catch {
    return true
  }
}

export function rateLimitMessage(): string {
  return '⏳ Too many requests. Please wait a minute and try again.'
}
