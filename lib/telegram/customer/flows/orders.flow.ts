import { InlineKeyboard, Bot } from 'grammy'
import type { CustomerBotContext } from '../../core/types'
import { getTelegramSupabase } from '../../core/supabase-admin'
import { formatEtb, truncateId } from '../../core/telegram-format'

async function getLinkedUser(chatId: number) {
  const { data: user, error } = await getTelegramSupabase()
    .from('telegram_users')
    .select('profile_id, is_verified, chat_id')
    .eq('chat_id', chatId)
    .maybeSingle()

  if (error || !user || !user.is_verified) return null
  return user
}

export async function handleOrders(ctx: CustomerBotContext) {
  if (!ctx.chat) return
  await ctx.replyWithChatAction('typing')

  const user = await getLinkedUser(ctx.chat.id)
  if (!user) {
    return ctx.reply('❌ Link your account first with /link', { parse_mode: 'HTML' })
  }

  const { data: orders, error } = await getTelegramSupabase()
    .from('orders')
    .select('id, amount, status, created_at')
    .eq('buyer_id', user.profile_id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return ctx.reply('❌ Error fetching orders.')
  if (!orders?.length) return ctx.reply('✅ You have no recent orders.')

  let message = '📦 <b>Your Recent Orders</b>\n\n'
  for (const order of orders) {
    const emoji = order.status === 'delivered' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳'
    message += `${emoji} #${truncateId(order.id)} — ${formatEtb(Number(order.amount))} — <i>${order.status}</i>\n`
  }
  await ctx.reply(message, { parse_mode: 'HTML' })
}

export function registerOrdersFlow(bot: Bot<CustomerBotContext>) {
  bot.command('orders', handleOrders)

  bot.command('track', async (ctx) => {
    if (!ctx.chat) return
    const user = await getLinkedUser(ctx.chat.id)
    if (!user) return ctx.reply('❌ Link your account first with /link', { parse_mode: 'HTML' })

    const { data: orders, error } = await getTelegramSupabase()
      .from('orders')
      .select('id, status')
      .eq('buyer_id', user.profile_id)
      .in('status', ['pending', 'accepted', 'shipped'])
      .order('created_at', { ascending: false })
      .limit(3)

    if (error || !orders?.length) {
      return ctx.reply('✅ No active orders to track.')
    }

    for (const order of orders) {
      const keyboard = new InlineKeyboard()
      if (order.status === 'pending') {
        keyboard.text('❌ Cancel', `cancel_order_${order.id}`)
      }
      keyboard.url('🌐 View', `https://kelalshop.com/dashboard/orders`)

      await ctx.reply(
        `🚚 <b>Order #${truncateId(order.id)}</b>\nStatus: <b>${order.status}</b>`,
        { parse_mode: 'HTML', reply_markup: keyboard }
      )
    }
  })

  bot.callbackQuery(/cancel_order_(.*)/, async (ctx) => {
    if (!ctx.chat) return ctx.answerCallbackQuery({ text: 'Error' })

    const user = await getLinkedUser(ctx.chat.id)
    if (!user) return ctx.answerCallbackQuery({ text: 'Link account first' })

    const orderId = ctx.match[1]
    const { data, error } = await getTelegramSupabase()
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('buyer_id', user.profile_id)
      .eq('status', 'pending')
      .select('id')

    if (error || !data?.length) {
      return ctx.answerCallbackQuery({ text: 'Cannot cancel — may already be processed' })
    }

    await ctx.editMessageText(`❌ Order #${truncateId(orderId)} cancelled.`)
    await ctx.answerCallbackQuery({ text: 'Cancelled' })
  })
}
