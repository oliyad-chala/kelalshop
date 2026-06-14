import { NextResponse } from 'next/server'
import { getTelegramSupabase } from '@/lib/telegram/core/supabase-admin'
import { processNotificationQueue } from '@/lib/telegram/notifications/queue-processor'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processNotificationQueue(50)
  return NextResponse.json({ ok: true, ...result })
}

export async function POST(req: Request) {
  return GET(req)
}
