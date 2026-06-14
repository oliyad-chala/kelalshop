import { customerBot } from '@/lib/telegram/customer/bot'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token')

  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.error('Unauthorized customer webhook access attempt')
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const update = await req.json()
    await customerBot.init()
    await customerBot.handleUpdate(update)
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing customer Telegram update:', error)
    return new Response('OK', { status: 200 })
  }
}
