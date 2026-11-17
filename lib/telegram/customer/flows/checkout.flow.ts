import { InlineKeyboard, Keyboard, type Bot } from 'grammy'
import type { CustomerBotContext } from '../../core/types'
import { getTelegramSupabase } from '../../core/supabase-admin'
import { formatEtb, truncateId, escapeHtml } from '../../core/telegram-format'
import { emitTelegramEvent } from '../../notifications/templates'

export interface CheckoutSession {
  productId: string
  productName: string
  productPrice: number
  productImage?: string | null
  shopperId: string
  shopperName: string
  shopperPhone?: string
  quantity: number
  step: 'phone' | 'address' | 'payment'
  phone?: string
  address?: string
  paymentMethod?: 'cod' | 'telebirr' | 'cbe'
}

// In-memory checkout state per Telegram chat
const checkoutSessions = new Map<number, CheckoutSession>()

export function getCheckoutSession(chatId: number): CheckoutSession | undefined {
  return checkoutSessions.get(chatId)
}

export function clearCheckoutSession(chatId: number): void {
  checkoutSessions.delete(chatId)
}

/**
 * Ensures a buyer profile exists in Supabase for this Telegram user,
 * auto-provisioning one if not yet linked.
 */
export async function ensureTelegramBuyerProfile(
  chatId: number,
  from?: { id: number; first_name?: string; last_name?: string; username?: string }
): Promise<string> {
  const supabase = getTelegramSupabase()

  // 1. Check existing telegram_users
  const { data: existingTgUser } = await supabase
    .from('telegram_users')
    .select('profile_id, is_verified')
    .eq('chat_id', chatId)
    .maybeSingle()

  if (existingTgUser?.profile_id) {
    return existingTgUser.profile_id
  }

  // 2. Auto-provision auth user + buyer profile
  const fullName = [from?.first_name, from?.last_name].filter(Boolean).join(' ') || 'Telegram Shopper'
  const email = `tg_${chatId}_${Date.now()}@kelalshop.local`

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'buyer',
      telegram_chat_id: chatId,
      telegram_username: from?.username || null,
    },
  })

  if (authError || !authData?.user) {
    console.error('[Telegram Checkout] Failed to create auth user:', authError)
    throw new Error('Could not provision customer account. Please contact support.')
  }

  const profileId = authData.user.id

  // 3. Upsert telegram_users record linking profile
  await supabase.from('telegram_users').upsert(
    {
      chat_id: chatId,
      profile_id: profileId,
      username: from?.username || null,
      first_name: from?.first_name || null,
      is_verified: true,
      linked_at: new Date().toISOString(),
    },
    { onConflict: 'chat_id' }
  )

  return profileId
}

/**
 * Initiates frictionless in-chat checkout when user taps "⚡ Buy in Telegram"
 */
export async function startInChatCheckout(ctx: CustomerBotContext, productId: string) {
  const chatId = ctx.chat?.id
  if (!chatId) return

  const supabase = getTelegramSupabase()

  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, price, shopper_id, is_available, approval_status, attributes, product_images(url, is_primary), profiles:shopper_id(full_name, phone)')
    .eq('id', productId)
    .single()

  if (error || !product) {
    return ctx.reply('⚠️ Product not found or no longer available.')
  }
  if (!product.is_available) {
    return ctx.reply('⚠️ Sorry, this item is currently out of stock.')
  }
  if (product.approval_status !== 'approved') {
    return ctx.reply('⚠️ This product is pending admin approval and cannot be purchased yet.')
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
  const safeWebUrl = !baseUrl || baseUrl.includes('localhost') ? 'https://kelalshop.com' : baseUrl

  if (Number(product.price) <= 0 || (product as any).attributes?.price_type === 'on_call') {
    return ctx.reply(
      `📞 <b>${escapeHtml(product.name)}</b> is <b>Price on Call</b>.\n\n` +
      `Please contact the seller directly to negotiate and arrange the purchase:`,
      {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().url('📞 Contact Seller', `${safeWebUrl}/products/${product.id}?contact=open`)
      }
    )
  }

  const primaryImage = product.product_images?.find((i: any) => i.is_primary)?.url || product.product_images?.[0]?.url || null
  const shopperProfile = Array.isArray(product.profiles) ? product.profiles[0] : product.profiles

  const session: CheckoutSession = {
    productId: product.id,
    productName: product.name,
    productPrice: Number(product.price),
    productImage: primaryImage,
    shopperId: product.shopper_id,
    shopperName: shopperProfile?.full_name || 'Verified Shopper',
    shopperPhone: shopperProfile?.phone || undefined,
    quantity: 1,
    step: 'phone',
  }

  checkoutSessions.set(chatId, session)

  const productWebUrl = `${safeWebUrl}/products/${product.id}`

  const cancelKeyboard = new InlineKeyboard().text('❌ Cancel Order', 'checkout_cancel')

  const wholesaleNotice =
    `💡 <i>Need more quantity or wholesale?</i>\n` +
    `👉 <a href="${productWebUrl}">Contact seller directly on KelalShop website</a>\n`

  // Check if user already has a saved phone in profiles
  const { data: tgUser } = await supabase
    .from('telegram_users')
    .select('profile_id, profiles:profile_id(phone)')
    .eq('chat_id', chatId)
    .maybeSingle()

  const profileData = Array.isArray(tgUser?.profiles) ? tgUser?.profiles[0] : tgUser?.profiles
  const existingPhone = profileData?.phone

  if (existingPhone) {
    session.phone = existingPhone
    session.step = 'address'

    const caption =
      `🛍️ <b>Instant Order: ${escapeHtml(session.productName)}</b>\n\n` +
      `💰 Price: <b>${formatEtb(session.productPrice)}</b> (1 Item)\n` +
      `👤 Verified Shopper: <b>${escapeHtml(session.shopperName)}</b>\n` +
      `📱 Contact Phone: <b>${existingPhone}</b>\n\n` +
      wholesaleNotice +
      `\n━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 <b>Step 1 of 2: Delivery Location</b>\n\n` +
      `Where should the shopper deliver your order?\n` +
      `Please reply with your delivery address or nearest landmark (e.g. <i>Addis Ababa, Bole near Edna Mall</i>):`

    if (primaryImage) {
      try {
        return await ctx.replyWithPhoto(primaryImage, {
          caption,
          parse_mode: 'HTML',
          reply_markup: cancelKeyboard,
        })
      } catch {
        // ignore photo error, fallback to text
      }
    }

    return await ctx.reply(caption, {
      parse_mode: 'HTML',
      reply_markup: cancelKeyboard,
    })
  }

  // Ask for phone number with 1-tap contact button
  session.step = 'phone'

  const phoneKeyboard = new Keyboard()
    .requestContact('📱 Tap to Share My Phone Number')
    .row()
    .text('❌ Cancel Order')
    .resized()
    .oneTime()

  const caption =
    `🛍️ <b>Instant Order: ${escapeHtml(session.productName)}</b>\n\n` +
    `💰 Price: <b>${formatEtb(session.productPrice)}</b> (1 Item)\n` +
    `👤 Verified Shopper: <b>${escapeHtml(session.shopperName)}</b>\n\n` +
    wholesaleNotice +
    `\n━━━━━━━━━━━━━━━━━━━━\n` +
    `📱 <b>Step 1 of 2: Delivery Phone Number</b>\n\n` +
    `Tap the button below to share your phone number, or type your mobile number (e.g. <code>0912345678</code>):`

  if (primaryImage) {
    try {
      await ctx.replyWithPhoto(primaryImage, {
        caption,
        parse_mode: 'HTML',
        reply_markup: cancelKeyboard,
      })
      return await ctx.reply('👇 Tap below to share your contact phone:', {
        reply_markup: phoneKeyboard,
      })
    } catch {
      // fallback
    }
  }

  return await ctx.reply(caption, {
    parse_mode: 'HTML',
    reply_markup: phoneKeyboard,
  })
}

/**
 * Registers all in-chat checkout callbacks and message handlers
 */
export function registerCheckoutFlow(bot: Bot<CustomerBotContext>, mainMenuKeyboard: any) {
  // 1. Phone Number Handler (Contact sharing or text)
  bot.on('message:contact', async (ctx, next) => {
    const chatId = ctx.chat?.id
    if (!chatId) return next()

    const session = checkoutSessions.get(chatId)
    if (!session || session.step !== 'phone') return next()

    let phone = ctx.message.contact.phone_number
    if (!phone.startsWith('+') && !phone.startsWith('0')) {
      phone = '+' + phone
    }

    session.phone = phone
    session.step = 'address'

    await ctx.reply(`✅ Phone number confirmed: <b>${phone}</b>`, {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard,
    })

    const cancelKeyboard = new InlineKeyboard().text('❌ Cancel Order', 'checkout_cancel')

    await ctx.reply(
      `📍 <b>Step 2 of 2: Delivery Location</b>\n\n` +
        `Where should the shopper deliver your <b>${escapeHtml(session.productName)}</b> (${formatEtb(session.productPrice)})?\n\n` +
        `Type your delivery address or landmark (e.g. <i>Addis Ababa, Bole Mikael near church</i>):`,
      {
        parse_mode: 'HTML',
        reply_markup: cancelKeyboard,
      }
    )
  })

  // 2. Address Text or Manual Phone Input Handler
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat?.id
    const text = ctx.message.text.trim()
    if (!chatId) return next()

    const session = checkoutSessions.get(chatId)
    if (!session) return next()

    // Handle Cancel
    if (text === '❌ Cancel Order' || text === '/cancel') {
      checkoutSessions.delete(chatId)
      return await ctx.reply('❌ Order cancelled. Use the menu anytime to browse products.', {
        reply_markup: mainMenuKeyboard,
      })
    }

    // Step: Manual Phone Input
    if (session.step === 'phone') {
      const cleanPhone = text.replace(/[\s-]/g, '')
      const phoneRegex = /^(\+251|0)[79]\d{8}$/
      if (!phoneRegex.test(cleanPhone)) {
        return await ctx.reply(
          '⚠️ Please provide a valid Ethiopian phone number (e.g. <code>0912345678</code> or <code>+251912345678</code>), or tap "Share My Phone Number":',
          { parse_mode: 'HTML' }
        )
      }

      session.phone = cleanPhone
      session.step = 'address'

      const cancelKeyboard = new InlineKeyboard().text('❌ Cancel Order', 'checkout_cancel')

      return await ctx.reply(
        `✅ Phone number confirmed: <b>${cleanPhone}</b>\n\n` +
          `📍 <b>Step 2 of 2: Delivery Location</b>\n\n` +
          `Where should the shopper deliver your <b>${escapeHtml(session.productName)}</b> (${formatEtb(session.productPrice)})?\n\n` +
          `Type your delivery address or landmark (e.g. <i>Addis Ababa, Bole near Edna Mall</i>):`,
        {
          parse_mode: 'HTML',
          reply_markup: cancelKeyboard,
        }
      )
    }

    // Step: Delivery Address Input
    if (session.step === 'address') {
      if (text.length < 3) {
        return await ctx.reply('⚠️ Please provide a valid location or landmark for delivery:')
      }

      session.address = text
      session.step = 'payment'

      const totalAmount = session.productPrice * session.quantity

      const confirmKeyboard = new InlineKeyboard()
        .text('✅ Confirm Order (Cash on Handover)', 'checkout_confirm_order')
        .row()
        .text('❌ Cancel Order', 'checkout_cancel')

      return await ctx.reply(
        `📦 <b>Review Your Order</b>\n\n` +
          `• Product: <b>${escapeHtml(session.productName)}</b>\n` +
          `• Total Due: <b>${formatEtb(totalAmount)}</b>\n` +
          `• Delivery To: <b>${escapeHtml(session.address)}</b>\n` +
          `• Contact Phone: <b>${session.phone}</b>\n` +
          `• Payment Method: <b>💵 Cash on Handover / Delivery</b>\n` +
          `  <i>(Pay in cash only after inspecting your item upon handover)</i>\n\n` +
          `Tap below to confirm and dispatch your order:`,
        {
          parse_mode: 'HTML',
          reply_markup: confirmKeyboard,
        }
      )
    }

    return next()
  })

  // 3. Confirm Order & Finalize (Cash on Handover)
  bot.callbackQuery(/^(checkout_confirm_order|checkout_pay_cod)$/, async (ctx) => {
    const chatId = ctx.chat?.id
    if (!chatId) return ctx.answerCallbackQuery()

    const session = checkoutSessions.get(chatId)
    if (!session || !session.phone || !session.address) {
      return ctx.answerCallbackQuery({ text: 'Session expired. Please restart your order.' })
    }

    const paymentTitle = 'Cash on Handover / Delivery'

    await ctx.answerCallbackQuery({ text: 'Placing your order...' })

    try {
      const supabase = getTelegramSupabase()

      // Ensure buyer profile exists
      const buyerProfileId = await ensureTelegramBuyerProfile(chatId, ctx.from)

      const totalAmount = session.productPrice * session.quantity
      const deliveryNote =
        `[Telegram In-Chat Order] Customer: ${ctx.from?.first_name || 'Customer'} | ` +
        `Phone: ${session.phone} | Delivery: ${session.address} | Payment: ${paymentTitle} | Qty: ${session.quantity}`

      // Insert Order into Supabase
      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          product_id: session.productId,
          buyer_id: buyerProfileId,
          shopper_id: session.shopperId,
          amount: totalAmount,
          status: 'pending',
          notes: deliveryNote,
        })
        .select('id')
        .single()

      if (insertError || !newOrder) {
        console.error('[InChat Checkout] Order insert error:', insertError)
        return ctx.reply('❌ Could not place order. Please try again or contact support.')
      }

      // Update buyer phone in profiles table if needed
      await supabase
        .from('profiles')
        .update({ phone: session.phone })
        .eq('id', buyerProfileId)
        .is('phone', null)

      // Emit notifications to admin and shopper
      emitTelegramEvent('admin', 'NEW_ORDER', { orderId: newOrder.id, amount: totalAmount }, {
        idempotencyKey: `tg-inchat-order-${newOrder.id}`,
      })
      emitTelegramEvent('customer', 'ORDER_RECEIVED', { orderId: newOrder.id, amount: totalAmount }, {
        targetProfileId: session.shopperId,
        idempotencyKey: `tg-inchat-shopper-${newOrder.id}`,
      })

      // Clean up session
      checkoutSessions.delete(chatId)

      const shortId = truncateId(newOrder.id)
      const shopperContactText = session.shopperPhone
        ? `\n📞 Shopper Phone: <b>${session.shopperPhone}</b>`
        : ''

      const paymentInstructions =
        `\n\n💡 <i>Payment Note: Please prepare exact cash of ${formatEtb(totalAmount)} to pay upon inspecting your package at handover.</i>`

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
      const safeWebUrl = !baseUrl || baseUrl.includes('localhost') ? 'https://kelalshop.com' : baseUrl

      const orderReceiptKeyboard = new InlineKeyboard()
        .url('🌐 View Order on Website', `${safeWebUrl}/dashboard/buyer/orders`)
        .row()
        .text('🛍️ Browse More Products', 'nav_deals')

      await ctx.reply(
        `🎉 <b>Order Placed Successfully!</b>\n\n` +
          `📋 <b>Order ID:</b> <code>#${shortId}</code>\n` +
          `📦 <b>Product:</b> ${escapeHtml(session.productName)}\n` +
          `💰 <b>Total Due:</b> <b>${formatEtb(totalAmount)}</b>\n` +
          `📍 <b>Delivery To:</b> ${escapeHtml(session.address)}\n` +
          `📱 <b>Contact Phone:</b> ${session.phone}\n` +
          `💳 <b>Payment Method:</b> 💵 ${paymentTitle}\n\n` +
          `👤 <b>Assigned Shopper:</b> ${escapeHtml(session.shopperName)}${shopperContactText}` +
          paymentInstructions +
          `\n\n<i>The verified shopper will contact you shortly to coordinate handover. You can check order status anytime using /orders!</i>`,
        {
          parse_mode: 'HTML',
          reply_markup: orderReceiptKeyboard,
        }
      )
    } catch (err) {
      console.error('[InChat Checkout] Exception:', err)
      await ctx.reply('❌ An error occurred placing your order. Please try again.')
    }
  })

  // 4. Cancel Callback
  bot.callbackQuery('checkout_cancel', async (ctx) => {
    const chatId = ctx.chat?.id
    if (chatId) checkoutSessions.delete(chatId)
    await ctx.answerCallbackQuery({ text: 'Order cancelled' })
    await ctx.reply('❌ Order cancelled. Use the menu anytime to browse products or search.', {
      reply_markup: mainMenuKeyboard,
    })
  })
}
