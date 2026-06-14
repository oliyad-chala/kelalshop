import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

/**
 * DEV ONLY — Do not run alongside production webhooks.
 */
import './lib/telegram/customer/bot'

console.log('🛒 Starting Customer Bot (dev polling)...')

import { customerBot } from './lib/telegram/customer/bot'

customerBot.start({
  onStart: (info) => {
    console.log(`🚀 @${info.username} active. Send /start in Telegram.`)
  },
})
