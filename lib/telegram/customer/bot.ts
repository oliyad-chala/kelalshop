import { Bot } from 'grammy'
import type { CustomerBotContext } from '../core/types'
import { telegramErrorHandler } from '../core/error-handler'
import { registerCustomerHandlers } from './register-handlers'

if (!process.env.TELEGRAM_CUSTOMER_BOT_TOKEN) {
  throw new Error('TELEGRAM_CUSTOMER_BOT_TOKEN is not defined in environment variables')
}

export const customerBot = new Bot<CustomerBotContext>(process.env.TELEGRAM_CUSTOMER_BOT_TOKEN)

registerCustomerHandlers(customerBot)
customerBot.catch(telegramErrorHandler)

// Register persistent bottom menu web_app button dynamically using NEXT_PUBLIC_SITE_URL (must be HTTPS)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
if (BASE_URL.startsWith('https://')) {
  customerBot.api.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: '🛍️ Shop / Checkout',
      web_app: { url: `${BASE_URL}/telegram/checkout` }
    }
  }).catch((err) => {
    console.error('Failed to set customer bot menu button:', err)
  })
} else {
  console.log('⚠️ Skipping persistent bottom menu button registration because NEXT_PUBLIC_SITE_URL is not HTTPS (localhost).')
}

export type { CustomerBotContext as CustomerContext }
