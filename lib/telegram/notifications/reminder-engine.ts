import { createAdminClient } from '@/lib/supabase/admin'
import { customerBot } from '../customer/bot'
import { generateAIContentWithFallback } from '../ai/client-wrapper'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'

/**
 * 1. New User First-Order Reminder
 * Reminds users who joined/started the bot (> 12 hours ago) but haven't placed an order yet.
 */
export async function sendNewUserFirstOrderReminders(): Promise<number> {
  const admin = createAdminClient()
  let sentCount = 0

  // Find users who started the bot at least 12 hours ago
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: users, error } = await admin
    .from('telegram_users')
    .select('id, chat_id, first_name, username, profile_id, created_at')
    .lt('created_at', twelveHoursAgo)
    .gt('created_at', sevenDaysAgo)
    .limit(50)

  if (error || !users || users.length === 0) return 0

  for (const user of users) {
    if (!user.chat_id) continue
    const chatId = user.chat_id

    // Check if we already sent an onboarding/first-order reminder to this user
    const { data: existingLog } = await admin
      .from('telegram_reminder_logs')
      .select('id')
      .eq('chat_id', chatId)
      .eq('reminder_type', 'first_order_welcome')
      .maybeSingle()

    if (existingLog) continue

    // If user has a linked profile, verify they haven't placed any orders
    if (user.profile_id) {
      const { count: orderCount } = await admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_id', user.profile_id)

      if (orderCount && orderCount > 0) continue
    }

    // Compose warm, friendly message in Amharic & English
    const firstName = user.first_name ? ` <b>${user.first_name}</b>` : ''
    const message =
      `👋 <b>ሰላም${firstName}!</b> 🛍️\n\n` +
      `እንኳን ወደ <b>KelalShop</b> በደህና መጡ! እስካሁን ምንም ያዘዙት እቃ እንደሌለ አስተውለናል።\n\n` +
      `✨ <b>ምን መግዛት ይፈልጋሉ?</b>\n` +
      `• አዳዲስ የኤሌክትሮኒክስ እና የፋሽን እቃዎች\n` +
      `• ልዩ የቅናሽ ሽያጮች (Flash Deals)\n` +
      `• ማንኛውንም እቃ ከውጪ በታማኝ አስመጪዎች እንዲመጣልዎት መጠየቅ\n\n` +
      `<i>Looking for something special? Explore verified sellers and exclusive deals today! Tap below to start shopping. 😊</i>`

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🛍️ Open Shop Mini App', web_app: { url: `${BASE_URL}/telegram/checkout` } }
        ],
        [
          { text: '⚡ Flash Deals', callback_data: 'nav_deals' },
          { text: '🔍 Search Items', callback_data: 'nav_search' }
        ],
        [
          { text: '💬 Ask AI Assistant', callback_data: 'nav_ai_help' }
        ]
      ]
    }

    try {
      await customerBot.api.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      })

      await admin.from('telegram_reminder_logs').insert({
        chat_id: chatId,
        reminder_type: 'first_order_welcome',
      })

      sentCount++
    } catch (err) {
      console.error(`[New User Reminder] Failed for chat ${chatId}:`, err)
    }
  }

  return sentCount
}

/**
 * 2. Abandoned Cart Reminder
 * Reminds users who added items to their shopping cart > 25 mins ago but haven't checked out.
 */
export async function sendCartAbandonmentReminders(): Promise<number> {
  const admin = createAdminClient()
  const cutoffTime = new Date(Date.now() - 25 * 60 * 1000).toISOString()
  let sentCount = 0

  const { data: abandonedCarts, error: cartError } = await admin
    .from('cart_items')
    .select('user_id, updated_at')
    .lt('updated_at', cutoffTime)

  if (cartError || !abandonedCarts || abandonedCarts.length === 0) return 0

  const uniqueUserIds = Array.from(new Set(abandonedCarts.map((c: any) => c.user_id)))

  for (const userId of uniqueUserIds) {
    if (!userId) continue

    const { data: tgUser } = await admin
      .from('telegram_users')
      .select('chat_id, first_name')
      .eq('profile_id', userId)
      .eq('is_verified', true)
      .maybeSingle()

    if (!tgUser?.chat_id) continue
    const chatId = tgUser.chat_id

    // Prevent duplicate reminders within 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentReminder } = await admin
      .from('telegram_reminder_logs')
      .select('id')
      .eq('chat_id', chatId)
      .eq('reminder_type', 'cart_abandonment')
      .gt('sent_at', oneDayAgo)
      .maybeSingle()

    if (recentReminder) continue

    // Fetch items currently in their cart
    const { data: items } = await admin
      .from('cart_items')
      .select('quantity, product:product_id(name, price)')
      .eq('user_id', userId)

    if (!items || items.length === 0) continue

    const itemNames = items
      .map((i: any) => `${i.product?.name || 'Item'} (${i.quantity}x)`)
      .slice(0, 3)
      .join(', ')

    const firstName = tgUser.first_name ? ` <b>${tgUser.first_name}</b>` : ''
    const message =
      `🛒 <b>ሰላም${firstName}! እቃዎችዎን በቅርጫት ውስጥ እንዳይረሱ!</b> 🛍️\n\n` +
      `የመረጧቸው እቃዎች [<b>${itemNames}</b>] እርስዎን እየጠበቁ ነው።\n\n` +
      `እቃዎች ቶሎ ስለሚያልቁ ትዕዛዝዎን አሁኑኑ ያጠናቅቁ!\n\n` +
      `<i>Items in your cart are waiting for you. Tap below to complete your checkout in 30 seconds. 😊</i>`

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

    try {
      await customerBot.api.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      })

      await admin.from('telegram_reminder_logs').insert({
        chat_id: chatId,
        reminder_type: 'cart_abandonment',
      })

      sentCount++
    } catch (err) {
      console.error(`[Cart Reminder] Failed for chat ${chatId}:`, err)
    }
  }

  return sentCount
}

/**
 * 3. Pending Order Payment Reminder
 * Reminds users whose order is in 'pending' status for > 2 hours to submit receipt / complete payment.
 */
export async function sendPendingOrderReminders(): Promise<number> {
  const admin = createAdminClient()
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
  let sentCount = 0

  const { data: pendingOrders, error } = await admin
    .from('orders')
    .select(`
      id,
      amount,
      buyer_id,
      created_at,
      products(name)
    `)
    .eq('status', 'pending')
    .lt('created_at', twoHoursAgo)
    .gt('created_at', threeDaysAgo)
    .limit(30)

  if (error || !pendingOrders || pendingOrders.length === 0) return 0

  for (const order of pendingOrders) {
    if (!order.buyer_id) continue

    const { data: tgUser } = await admin
      .from('telegram_users')
      .select('chat_id, first_name')
      .eq('profile_id', order.buyer_id)
      .eq('is_verified', true)
      .maybeSingle()

    if (!tgUser?.chat_id) continue
    const chatId = tgUser.chat_id

    // Check if reminder was sent in last 24h for this specific order
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const reminderKey = `pending_order_${order.id}`
    const { data: recentReminder } = await admin
      .from('telegram_reminder_logs')
      .select('id')
      .eq('chat_id', chatId)
      .eq('reminder_type', reminderKey)
      .gt('sent_at', oneDayAgo)
      .maybeSingle()

    if (recentReminder) continue

    const productName = (order.products as any)?.name || 'Order Item'
    const shortId = order.id.slice(0, 8).toUpperCase()
    const firstName = tgUser.first_name ? ` <b>${tgUser.first_name}</b>` : ''

    const message =
      `📦 <b>ትዕዛዝ #${shortId} ማስታወሻ</b>${firstName}!\n\n` +
      `ያዘዙት እቃ: <b>${productName}</b>\n` +
      `መጠን: <b>ETB ${Number(order.amount).toFixed(2)}</b>\n\n` +
      `ትዕዛዝዎ ተይዞልዎታል! ሻጩ እቃዎን አሽጎ በቶሎ እንዲልክልዎት የክፍያ ደረሰኝ (CBE / Telebirr) መስቀልዎን እንዳይረሱ።\n\n` +
      `<i>Friendly reminder: Don't forget to submit your payment receipt so the seller can dispatch your package! 😊</i>`

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💳 Upload Receipt / View Order', web_app: { url: `${BASE_URL}/telegram/checkout` } }
        ],
        [
          { text: '💬 Chat with Support', callback_data: 'nav_support' }
        ]
      ]
    }

    try {
      await customerBot.api.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      })

      await admin.from('telegram_reminder_logs').insert({
        chat_id: chatId,
        reminder_type: reminderKey,
      })

      sentCount++
    } catch (err) {
      console.error(`[Pending Order Reminder] Failed for chat ${chatId}:`, err)
    }
  }

  return sentCount
}

/**
 * 4. Unified Reminder Runner
 * Executes all reminder checks and returns summary metrics.
 */
export async function runCustomerReminderEngine(): Promise<{
  newUsersReminded: number
  cartsReminded: number
  ordersReminded: number
}> {
  try {
    const [newUsersReminded, cartsReminded, ordersReminded] = await Promise.all([
      sendNewUserFirstOrderReminders(),
      sendCartAbandonmentReminders(),
      sendPendingOrderReminders(),
    ])

    return {
      newUsersReminded,
      cartsReminded,
      ordersReminded,
    }
  } catch (err) {
    console.error('[runCustomerReminderEngine] Error:', err)
    return {
      newUsersReminded: 0,
      cartsReminded: 0,
      ordersReminded: 0,
    }
  }
}
