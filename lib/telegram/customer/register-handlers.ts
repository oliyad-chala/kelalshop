import { Keyboard, InlineKeyboard } from 'grammy'
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
        '• /cart — View cart & checkout\n' +
        '• /remind — Shopping reminders\n' +
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

    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
    const keyboard = {
      inline_keyboard: [
        [
          { text: '💳 Secure Checkout Mini App', web_app: { url: `${BASE_URL}/telegram/checkout` } }
        ],
        [
          { text: '⏰ Remind Me Tomorrow', callback_data: 'remind_cart_tomorrow' }
        ]
      ]
    }

    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard })
  })

  // ─── Customer Reminder Callbacks & Command ───────────────────────────────
  bot.command('remind', async (ctx) => {
    const chatId = ctx.chat?.id
    if (!chatId) return
    const admin = getTelegramSupabase()

    const { data: tgUser } = await admin
      .from('telegram_users')
      .select('profile_id, is_verified, first_name')
      .eq('chat_id', chatId)
      .maybeSingle()

    let hasCart = false
    let pendingOrders = 0

    if (tgUser?.profile_id) {
      const [{ count: cartCount }, { count: orderCount }] = await Promise.all([
        admin.from('cart_items').select('id', { count: 'exact', head: true }).eq('user_id', tgUser.profile_id),
        admin.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_id', tgUser.profile_id).eq('status', 'pending'),
      ])
      hasCart = Boolean(cartCount && cartCount > 0)
      pendingOrders = orderCount || 0
    }

    const name = tgUser?.first_name ? ` ${tgUser.first_name}` : ''
    let msg = `⏰ <b>Shopping Assistant Reminders</b>\n\n`

    if (hasCart) {
      msg += `🛒 <b>You have items in your shopping cart!</b>\nUse /cart to view your items or tap checkout below.\n\n`
    }
    if (pendingOrders > 0) {
      msg += `📦 <b>You have ${pendingOrders} pending order(s)!</b>\nUse /orders to track and upload receipts.\n\n`
    }
    if (!hasCart && pendingOrders === 0) {
      msg += `✨ You have no pending orders or cart items right now!\n\n` +
        `Ready to shop? Check out today's top deals or search for any item you need.`
    }

    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🛍️ Open Shop', web_app: { url: `${BASE_URL}/telegram/checkout` } },
          { text: '⚡ Flash Deals', callback_data: 'nav_deals' }
        ]
      ]
    }

    await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard })
  })

  // Handle inline button callbacks from reminders & cart
  bot.callbackQuery('remind_cart_tomorrow', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '⏰ Reminder scheduled for tomorrow!' })
    const chatId = ctx.chat?.id
    if (chatId) {
      const admin = getTelegramSupabase()
      await admin.from('telegram_reminder_logs').insert({
        chat_id: chatId,
        reminder_type: 'cart_abandonment',
      })
    }
    await ctx.reply(
      '✅ <b>ተመዝግቧል!</b> እቃዎች እንዳያመልጡዎት ነገ በዚህ ሰዓት እናስታውስዎታለን። 😊\n\n' +
      '<i>Got it! We will send you a friendly reminder tomorrow so you don\'t miss out on your items.</i>',
      { parse_mode: 'HTML' }
    )
  })

  bot.callbackQuery('nav_deals', async (ctx) => {
    await ctx.answerCallbackQuery()
    return handleDeals(ctx as any)
  })

  bot.callbackQuery('nav_search', async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.reply(
      '🔍 <b>Product Search</b>\n\nType what you are looking for below (e.g. <i>iPhone 15, Nike shoes, perfume</i>):',
      { parse_mode: 'HTML', reply_markup: { force_reply: true, selective: true } }
    )
  })

  bot.callbackQuery('nav_support', async (ctx) => {
    await ctx.answerCallbackQuery()
    return handleSupportPrompt(ctx as any)
  })

  bot.callbackQuery('nav_ai_help', async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.reply(
      '🤖 <b>How can I help you today?</b>\n\n' +
      'Type any question about products, delivery, payment (CBE / Telebirr), or how to place an order, and I\'ll assist you right away!',
      { parse_mode: 'HTML' }
    )
  })

  // Customer commands to close/exit an open ticket and return to AI shopping assistant
  bot.command(['close', 'exit', 'cancel'], async (ctx) => {
    const chatId = ctx.chat?.id
    if (!chatId) return

    const admin = getTelegramSupabase()
    const { data: activeSession } = await admin
      .from('support_sessions')
      .select('id, assigned_staff_tg_chat_id')
      .eq('guest_id', chatId.toString())
      .neq('status', 'closed')
      .maybeSingle()

    if (!activeSession) {
      return ctx.reply('✅ You do not have an active support ticket. How can I help you today?', { reply_markup: mainMenu })
    }

    await admin
      .from('support_sessions')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', activeSession.id)

    if (activeSession.assigned_staff_tg_chat_id) {
      const { bot: adminBot } = await import('../admin/bot')
      await adminBot.api.sendMessage(
        activeSession.assigned_staff_tg_chat_id,
        `ℹ️ <b>Customer closed Ticket #${activeSession.id.slice(0, 8)}.</b>`,
        { parse_mode: 'HTML' }
      ).catch(() => {})
    }

    await ctx.reply(
      `✅ <b>Ticket #${activeSession.id.slice(0, 8)} has been closed.</b>\n\nYou are now chatting with our AI Shopping Assistant! Feel free to ask about products, prices, or orders.`,
      { parse_mode: 'HTML', reply_markup: mainMenu }
    )
  })

  // Callback button to close ticket
  bot.callbackQuery(/^close_ticket_(.+)$/, async (ctx) => {
    const ticketId = ctx.match[1]
    const admin = getTelegramSupabase()

    const { data: session } = await admin
      .from('support_sessions')
      .select('id, assigned_staff_tg_chat_id')
      .eq('id', ticketId)
      .maybeSingle()

    await admin
      .from('support_sessions')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    if (session?.assigned_staff_tg_chat_id) {
      const { bot: adminBot } = await import('../admin/bot')
      await adminBot.api.sendMessage(
        session.assigned_staff_tg_chat_id,
        `ℹ️ <b>Customer closed Ticket #${ticketId.slice(0, 8)}.</b>`,
        { parse_mode: 'HTML' }
      ).catch(() => {})
    }

    await ctx.answerCallbackQuery({ text: 'Ticket closed!' })
    await ctx.reply(
      `✅ <b>Ticket #${ticketId.slice(0, 8)} closed.</b>\n\nYou are now back to our AI Shopping Assistant! How can I help you today?`,
      { parse_mode: 'HTML', reply_markup: mainMenu }
    )
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
        const cancelBtn = new InlineKeyboard().text('❌ Close Ticket & Return to Shop', `close_ticket_${activeSession.id}`)
        await ctx.reply(
          `⏳ <b>Your request is queued.</b> An agent will claim it and reply shortly. (Ticket #${activeSession.id.slice(0, 8)})\n\n<i>To stop waiting and chat with our AI instead, tap below or type /close:</i>`,
          { parse_mode: 'HTML', reply_markup: cancelBtn }
        )
      }
      return
    }

    // 2. Otherwise, route query through Gemini AI Shopping/FAQ Agent
    const { handleCustomerAIQuery } = await import('../ai/customer-agent')
    await handleCustomerAIQuery(ctx)
  })
}
