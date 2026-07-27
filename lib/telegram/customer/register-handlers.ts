import { Keyboard } from 'grammy'
import type { Bot } from 'grammy'
import type { CustomerBotContext } from '../core/types'
import { handleLinkPrompt, registerAuthFlow } from './flows/auth.flow'
import { handleSupportPrompt, registerSupportFlow } from './flows/support.flow'
import { handleOrders, registerOrdersFlow } from './flows/orders.flow'
import { handleDeals, registerDealsFlow } from './flows/deals.flow'
import { registerSearchFlow } from './flows/search.flow'
import { getTelegramSupabase } from '../core/supabase-admin'

export const mainMenu = new Keyboard()
  .text('🔍 Search Products')
  .text('⚡ Flash Deals')
  .row()
  .text('📦 My Orders')
  .text('💬 Support Ticket')
  .row()
  .text('⚙️ Profile / Link Account')
  .resized()
  .persistent()

export function registerCustomerHandlers(bot: Bot<CustomerBotContext>) {
  bot.command('start', async (ctx) => {
    try {
      if (ctx.chat) {
        const supabase = getTelegramSupabase()
        await supabase.from('telegram_users').upsert(
          {
            chat_id: ctx.chat.id,
            username: ctx.from?.username ?? null,
            first_name: ctx.from?.first_name ?? null,
          },
          { onConflict: 'chat_id' }
        )
      }
    } catch (err) {
      console.error('[Telegram Start] Upsert failed:', err)
    }

    await ctx.reply(
      '👋 <b>Welcome to KelalShop!</b> 🛍️\n\n' +
        'Your shopping assistant — search products, track orders, get support.\n\n' +
        '👇 Use the menu below to get started.',
      { parse_mode: 'HTML', reply_markup: mainMenu }
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '🛍️ <b>Help</b>\n\n' +
        '• /orders — Your orders\n' +
        '• /track — Active orders\n' +
        '• /deals — Flash sales\n' +
        '• /search — Find products\n' +
        '• /support — Support ticket\n' +
        '• /link — Link account\n\n' +
        '🤖 Or describe what you need naturally!',
      { parse_mode: 'HTML', reply_markup: mainMenu }
    )
  })

  registerAuthFlow(bot)
  registerSupportFlow(bot)
  registerOrdersFlow(bot)
  registerDealsFlow(bot)

  bot.hears('🔍 Search Products', async (ctx) => {
    await ctx.reply(
      '🔍 <b>Product Search</b>\n\nType what you are looking for below (e.g. <i>gaming laptop under 80000 ETB</i>):',
      { parse_mode: 'HTML', reply_markup: { force_reply: true, selective: true } }
    )
  })
  bot.hears('⚡ Flash Deals', handleDeals)
  bot.hears('📦 My Orders', handleOrders)
  bot.hears('💬 Support Ticket', handleSupportPrompt)
  bot.hears('⚙️ Profile / Link Account', handleLinkPrompt)

  registerSearchFlow(bot)

  // Interactive Cart Summary Command
  bot.command('cart', async (ctx) => {
    const chatId = ctx.chat?.id
    if (!chatId) return
    const admin = getTelegramSupabase()
    
    const { data: tgUser } = await admin
      .from('telegram_users')
      .select('profile_id, is_verified')
      .eq('chat_id', chatId)
      .maybeSingle()

    if (!tgUser || !tgUser.is_verified || !tgUser.profile_id) {
      return ctx.reply('⚠️ Please link your account first using /link to view your cart.', { parse_mode: 'HTML' })
    }

    const { data: items } = await admin
      .from('cart_items')
      .select('*, product:product_id(name, price)')
      .eq('user_id', tgUser.profile_id)

    if (!items || items.length === 0) {
      return ctx.reply('🛒 Your cart is empty.', { parse_mode: 'HTML' })
    }

    let text = '🛒 <b>Your Cart Summary:</b>\n\n'
    let subtotal = 0
    for (const item of items) {
      const price = Number(item.product?.price || 0)
      const qty = item.quantity
      text += `• <b>${item.product?.name}</b>\n  ${qty} × ${price} ETB = <b>${qty * price} ETB</b>\n\n`
      subtotal += qty * price
    }
    text += `Subtotal: <b>${subtotal} ETB</b>`

    const keyboard = {
      inline_keyboard: [[
        { text: '💳 Secure Checkout Mini App', web_app: { url: 'https://kelalshop.com/telegram/checkout' } }
      ]]
    }

    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard })
  })

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim()
    if (text.startsWith('/')) return

    const chatId = ctx.chat?.id
    if (!chatId) return

    const admin = getTelegramSupabase()

    // 1. Check if the customer is in an active human support takeover session
    const { data: activeSession } = await admin
      .from('support_sessions')
      .select('id, assigned_staff_tg_chat_id, status')
      .eq('guest_id', chatId.toString())
      .neq('status', 'closed')
      .maybeSingle()

    if (activeSession && activeSession.status === 'human') {
      // Save customer message to support messages
      await admin.from('support_messages').insert({
        session_id: activeSession.id,
        sender_type: 'user',
        content: text,
      })

      if (activeSession.assigned_staff_tg_chat_id) {
        // Forward message to the claimed staff member's Admin Bot chat
        const { bot: adminBot } = await import('../admin/bot')
        await adminBot.api.sendMessage(
          activeSession.assigned_staff_tg_chat_id,
          `💬 <b>Customer (Ticket #${activeSession.id.slice(0, 8)}):</b>\n\n${text}`,
          { parse_mode: 'HTML' }
        )
      } else {
        await ctx.reply(`⏳ Your request is queued. An agent will claim it and reply shortly. (Ticket #${activeSession.id.slice(0, 8)})`, { parse_mode: 'HTML' })
      }
      return
    }

    // 2. Otherwise, route query through Gemini AI Shopping/FAQ Agent
    const { handleCustomerAIQuery } = await import('../ai/customer-agent')
    await handleCustomerAIQuery(ctx)
  })
}
