import { Bot } from 'grammy'
import type { AdminBotContext } from '../core/types'
import { authMiddleware } from './middleware/auth'
import { registerAdminHandlers } from './register-handlers'
import { telegramErrorHandler } from '../core/error-handler'

export type { AdminBotContext as BotContext }

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables')
}

export const bot = new Bot<AdminBotContext>(process.env.TELEGRAM_BOT_TOKEN)

bot.use(authMiddleware)
registerAdminHandlers(bot)
bot.catch(telegramErrorHandler)
