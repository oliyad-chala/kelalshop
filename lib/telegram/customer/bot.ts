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

export type { CustomerBotContext as CustomerContext }
