import { bot } from '@/lib/telegram/admin/bot'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token')

  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.error('Unauthorized webhook access attempt')
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const update = await req.json()
    await bot.init()
    await bot.handleUpdate(update)

    // Process queue opportunistically after each update
    import('@/lib/telegram/notifications/queue-processor')
      .then((m) => m.processNotificationQueue(5))
      .catch(() => {})

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing Telegram update:', error)
    return new Response('OK', { status: 200 })
  }
}
