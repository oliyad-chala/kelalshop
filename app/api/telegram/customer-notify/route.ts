import { NextResponse } from 'next/server'
import { emitTelegramEvent } from '@/lib/telegram/notifications/templates'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { event, payload, targetProfileId, idempotencyKey } = body

    if (!event) {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 })
    }

    emitTelegramEvent('customer', event, payload ?? {}, {
      targetProfileId,
      idempotencyKey,
    })

    return NextResponse.json({ success: true, queued: true })
  } catch (error) {
    console.error('Error queuing customer notification:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
