import { bot } from '@/lib/telegram/admin/bot'
import { after } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token')

  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.error('Unauthorized webhook access attempt')
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const update = await req.json()

    // Offload processing and queue operations to background, returning 200 OK immediately
    after(async () => {
      try {
        await bot.init()
        await bot.handleUpdate(update)

        // Process queue opportunistically in the background
        try {
          const { processNotificationQueue } = await import('@/lib/telegram/notifications/queue-processor')
          await processNotificationQueue(5)
        } catch (err) {
          console.error('[Webhook Queue Process] Error:', err)
        }
      } catch (err) {
        console.error('Error handling admin bot update in background:', err)
      }
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing Telegram update:', error)
    return new Response('OK', { status: 200 })
  }
}
