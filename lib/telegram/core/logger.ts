type LogLevel = 'info' | 'warn' | 'error' | 'security'

type LogPayload = Record<string, unknown>

export function telegramLog(
  service: 'telegram-admin' | 'telegram-customer' | 'telegram-notify',
  event: string,
  payload: LogPayload = {},
  level: LogLevel = 'info'
) {
  const entry = {
    level,
    service,
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn' || level === 'security') console.warn(line)
  else console.log(line)
}

export async function auditTelegramAction(params: {
  bot: 'admin' | 'customer'
  chatId: number
  command?: string
  role?: string
  result: 'success' | 'denied' | 'error'
  durationMs?: number
  error?: string
}) {
  telegramLog(
    params.bot === 'admin' ? 'telegram-admin' : 'telegram-customer',
    'audit',
    params,
    params.result === 'denied' ? 'security' : params.result === 'error' ? 'error' : 'info'
  )

  try {
    const { getTelegramSupabase } = await import('./supabase-admin')
    const supabase = getTelegramSupabase()
    await supabase.from('telegram_audit_logs').insert({
      bot: params.bot,
      chat_id: params.chatId,
      command: params.command ?? null,
      role: params.role ?? null,
      result: params.result,
      duration_ms: params.durationMs ?? null,
      error_message: params.error ?? null,
    })
  } catch {
    // Table may not exist yet during migration rollout
  }
}
