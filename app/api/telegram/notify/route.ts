import { NextResponse } from 'next/server'
import { emitTelegramEvent } from '@/lib/telegram/notifications/templates'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { event, payload, idempotencyKey } = body

    if (!event) {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 })
    }

    emitTelegramEvent('admin', event, payload ?? {}, { idempotencyKey })

    return NextResponse.json({ success: true, queued: true })
  } catch (error) {
    console.error('Error queuing notification:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
