import { NextResponse } from 'next/server'
import { getTelegramSupabase } from '@/lib/telegram/core/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {
    admin_token: process.env.TELEGRAM_BOT_TOKEN ? 'ok' : 'missing',
    customer_token: process.env.TELEGRAM_CUSTOMER_BOT_TOKEN ? 'ok' : 'missing',
    webhook_secret: process.env.TELEGRAM_WEBHOOK_SECRET ? 'ok' : 'missing',
    supabase: 'unknown',
    queue: 'unknown',
  }

  try {
    const supabase = getTelegramSupabase()
    const { error } = await supabase.from('telegram_admins').select('id').limit(1)
    checks.supabase = error ? `error: ${error.message}` : 'ok'

    const { count } = await supabase
      .from('telegram_notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    checks.queue = `pending: ${count ?? 0}`
  } catch (e) {
    checks.supabase = String(e)
  }

  const healthy = checks.admin_token === 'ok' && checks.customer_token === 'ok' && checks.webhook_secret === 'ok'

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  )
}
