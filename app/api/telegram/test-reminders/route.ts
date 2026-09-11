import { NextResponse } from 'next/server'
import { runCustomerReminderEngine } from '@/lib/telegram/notifications/reminder-engine'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const secret = process.env.CRON_SECRET || process.env.INTERNAL_API_KEY

    // Allow requests with matching secret OR in development environment
    const isDev = process.env.NODE_ENV !== 'production'
    if (!isDev && secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await runCustomerReminderEngine()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('[test-reminders API] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process reminders' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  return GET(req)
}
