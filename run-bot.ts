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

bot.start({
  onStart: (info) => {
    console.log(`🚀 @${info.username} active. Send /start in Telegram.`)
  },
})
