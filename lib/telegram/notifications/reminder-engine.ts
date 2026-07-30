import { createAdminClient } from '@/lib/supabase/admin'
import { customerBot } from '../customer/bot'
import { generateAIContentWithFallback } from '../ai/client-wrapper'

export async function sendCartAbandonmentReminders(): Promise<void> {
  const admin = createAdminClient()
  const cutoffTime = new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago

  // 1. Fetch unique users who have unmodified items in their cart for > 15 mins
  const { data: abandonedCarts, error: cartError } = await admin
    .from('cart_items')
    .select('user_id, updated_at')
    .lt('updated_at', cutoffTime)

  if (cartError || !abandonedCarts || abandonedCarts.length === 0) return

  // Deduplicate user IDs
  const uniqueUserIds = Array.from(new Set(abandonedCarts.map((c: any) => c.user_id)))

  for (const userId of uniqueUserIds) {
    if (!userId) continue

    // 2. Check if a verified Telegram chat is linked to this user
    const { data: tgUser } = await admin
      .from('telegram_users')
      .select('chat_id')
      .eq('profile_id', userId)
      .eq('is_verified', true)
      .maybeSingle()

    if (!tgUser?.chat_id) continue

    const chatId = tgUser.chat_id

    // 3. Prevent duplicate notifications within 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentReminder } = await admin
      .from('telegram_reminder_logs')
      .select('id')
      .eq('chat_id', chatId)
      .eq('reminder_type', 'cart_abandonment')
      .gt('sent_at', oneDayAgo)
      .maybeSingle()

    if (recentReminder) continue

    // 4. Fetch details of products in their cart
    const { data: items } = await admin
      .from('cart_items')
      .select('*, product:product_id(name, price)')
      .eq('user_id', userId)

    if (!items || items.length === 0) continue

    const itemNames = items.map((i: any) => `${i.product?.name || 'Item'} (Qty: ${i.quantity})`).join(', ')

    // 5. Use Gemini to write a polite reminder in Amharic (or English fallback)
    const prompt = `
You are the KelalShop Shopping Assistant. 
The customer has left these items in their shopping cart without completing checkout: [${itemNames}].
Write a highly friendly, personalized, and polite checkout reminder message. 
Write it in Amharic (አማርኛ) as the primary language, but add a brief English line at the end.
Inform them they can complete checkout in less than 30 seconds by tapping the "💳 Checkout" button below.

CRITICAL FORMATTING RULES:
- Return ONLY the final message. Do not include any explanations or headers.
- Format using clean HTML tags (e.g. <b>, <i>, <code>).
- Never output markdown bold indicators (e.g. ** or *) or code block ticks (e.g. \`\`\`).
`

    try {
      const response = await generateAIContentWithFallback({
        contents: prompt,
      })

      let aiMsg = response.text || ''
      aiMsg = aiMsg
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .trim()

      if (!aiMsg) continue

      // 6. Deliver the reminder with direct Web App checkout link button
      const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
      const keyboard = {
        inline_keyboard: [[
          { text: '💳 Secure Checkout Mini App', web_app: { url: `${BASE_URL}/telegram/checkout` } }
        ]]
      }

      await customerBot.api.sendMessage(chatId, aiMsg, { parse_mode: 'HTML', reply_markup: keyboard })

      // 7. Log reminder sent to prevent spamming
      await admin.from('telegram_reminder_logs').insert({
        chat_id: chatId,
        reminder_type: 'cart_abandonment',
      })
    } catch (err) {
      console.error(`[Reminder Engine] Failed to send reminder to ${chatId}:`, err)
    }
  }
}
