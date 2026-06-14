import { BotError, GrammyError, HttpError } from 'grammy'
import type { Context } from 'grammy'
import { telegramLog } from './logger'

export async function telegramErrorHandler(err: BotError<Context>) {
  const ctx = err.ctx
  const chatId = ctx.chat?.id

  telegramLog(
    ctx.me?.is_bot ? 'telegram-admin' : 'telegram-admin',
    'handler_error',
    {
      chatId,
      updateType: ctx.update?.update_id,
      error: err.message,
    },
    'error'
  )

  if (err.error instanceof GrammyError) {
    telegramLog('telegram-admin', 'grammy_api_error', {
      description: err.error.description,
      errorCode: err.error.error_code,
    }, 'error')
  } else if (err.error instanceof HttpError) {
    telegramLog('telegram-admin', 'grammy_http_error', { message: err.error.message }, 'error')
  }

  try {
    await ctx.reply(
      '⚠️ Something went wrong while processing your request. Please try again in a moment.',
      { parse_mode: 'HTML' }
    )
  } catch {
    // Ignore reply failures
  }
}
