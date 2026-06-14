import type { CustomerBotContext } from '../../core/types'
import { getTelegramSupabase } from '../../core/supabase-admin'
import { emitTelegramEvent } from '../../notifications/templates'
import { truncateId } from '../../core/telegram-format'
import type { Bot } from 'grammy'

export async function handleSupportPrompt(ctx: CustomerBotContext) {
  await ctx.reply(
    '🎫 <b>Customer Support</b>\n\nDescribe your issue in one message below:',
    { parse_mode: 'HTML', reply_markup: { force_reply: true, selective: true } }
  )
}

export function registerSupportFlow(bot: Bot<CustomerBotContext>) {
  bot.command('support', handleSupportPrompt)

  bot.on('message:text', async (ctx, next) => {
    const replyToText = ctx.message.reply_to_message?.text
    if (!replyToText?.includes('Describe your issue')) return next()

    const text = ctx.message.text.trim()
    if (text.startsWith('/')) return next()

    await ctx.replyWithChatAction('typing')

    let userId: string | null = null
    if (ctx.chat) {
      const { data: user } = await getTelegramSupabase()
        .from('telegram_users')
        .select('profile_id, is_verified')
        .eq('chat_id', ctx.chat.id)
        .maybeSingle()
      if (user?.is_verified && user.profile_id) userId = user.profile_id
    }

    const { data: session, error: sessionError } = await getTelegramSupabase()
      .from('support_sessions')
      .insert({ user_id: userId, status: 'human' })
      .select()
      .single()

    if (sessionError || !session) {
      return ctx.reply('❌ Could not create support ticket. Try again later.')
    }

    const { error: msgError } = await getTelegramSupabase().from('support_messages').insert({
      session_id: session.id,
      sender_type: 'user',
      content: text,
    })

    if (msgError) {
      return ctx.reply('❌ Ticket created but message failed. Contact us on the website.')
    }

    emitTelegramEvent('admin', 'SUPPORT_TICKET', {
      ticketId: session.id,
      subject: text.slice(0, 80),
    })

    return ctx.reply(
      `✅ <b>Ticket created!</b>\n\nID: <code>${truncateId(session.id)}</code>\nOur team will respond soon.`,
      { parse_mode: 'HTML' }
    )
  })
}
