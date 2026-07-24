import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

/**
 * DEV ONLY — Do not run alongside production webhooks.
 * Use npm run set-webhooks for 24/7 production operation.
 */
import './lib/telegram/admin/bot'

console.log('🤖 Starting Admin Bot (dev polling)...')
console.log('⚠️  Stop this before using webhooks in production.')

import { bot } from './lib/telegram/admin/bot'
import { processNotificationQueue } from './lib/telegram/notifications/queue-processor'

// Poll and process the database notification queue every 10 seconds in development
setInterval(async () => {
  try {
    const res = await processNotificationQueue(10)
    if (res.processed > 0 || res.failed > 0) {
      console.log(`[Queue Processor] Processed: ${res.processed}, Failed: ${res.failed}`)
    }
  } catch (err) {
    console.error('[Queue Processor] Error processing queue:', err)
  }
}, 10000)

bot.start({
  onStart: (info) => {
    console.log(`🚀 @${info.username} active. Send /start in Telegram.`)
  },
})
