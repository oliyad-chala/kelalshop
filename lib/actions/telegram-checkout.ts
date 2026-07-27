'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { validateTelegramInitData } from '../telegram/webapp/validation'
import { resolveOrderPrice } from '../utils/campaign-pricing'
import { logUserAction } from './activity-log'
import { emitTelegramEvent } from '../telegram/notifications/templates'

const botToken = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN!

export async function verifyTelegramWebAppData(initData: string) {
  if (!initData) {
    return { success: false, error: 'No data provided.' }
  }

  // 1. Validate initData cryptographically
  const validation = validateTelegramInitData(initData, botToken)
  if (!validation.success || !validation.user?.id) {
    return { success: false, error: validation.error || 'Invalid signature verification.' }
  }

  const tgChatId = validation.user.id
  const admin = createAdminClient()

  // 2. Fetch linked user profile
  const { data: tgUser, error: userError } = await admin
    .from('telegram_users')
    .select('profile_id, is_verified')
    .eq('chat_id', tgChatId)
    .maybeSingle()

  if (userError || !tgUser || !tgUser.is_verified || !tgUser.profile_id) {
    return { success: false, error: 'unlinked', message: 'Your Telegram account is not linked to a KelalShop account. Please link it using /link in the bot chat.' }
  }

  // 3. Fetch user profile info
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, phone, location')
    .eq('id', tgUser.profile_id)
    .single()

  // 4. Fetch cart items with product details and primary image
  const { data: cartItems } = await admin
    .from('cart_items')
    .select('*, product:product_id(*, product_images(*))')
    .eq('user_id', tgUser.profile_id)

  const items = (cartItems || []).map((item: any) => {
    const images = item.product?.product_images || []
    const primaryImg = images.find((i: any) => i.is_primary)?.url || images[0]?.url || null
    return {
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        stock: item.product.stock,
        image: primaryImg,
        shopperId: item.product.shopper_id,
      }
    }
  })

  return {
    success: true,
    profile,
    items,
  }
}

export async function executeTelegramCheckout(initData: string) {
  if (!initData) {
    throw new Error('Unauthorized checkout attempt.')
  }

  // 1. Re-validate initData cryptographically for security
  const validation = validateTelegramInitData(initData, botToken)
  if (!validation.success || !validation.user?.id) {
    throw new Error('Authentication signature failed.')
  }

  const tgChatId = validation.user.id
  const admin = createAdminClient()

  // 2. Resolve linked profile_id
  const { data: tgUser } = await admin
    .from('telegram_users')
    .select('profile_id, is_verified')
    .eq('chat_id', tgChatId)
    .maybeSingle()

  if (!tgUser || !tgUser.is_verified || !tgUser.profile_id) {
    throw new Error('Account linking required.')
  }

  const profileId = tgUser.profile_id

  // 3. Fetch cart items
  const { data: cartItems } = await admin
    .from('cart_items')
    .select('*, product:product_id(*)')
    .eq('user_id', profileId)

  if (!cartItems || cartItems.length === 0) {
    throw new Error('Your cart is empty.')
  }

  const createdOrderIds: string[] = []

  // 4. Place orders
  for (const item of cartItems) {
    const product = item.product
    if (!product.is_available) {
      throw new Error(`Product "${product.name}" is no longer available.`)
    }

    const price = Number(product.price)
    const amount = await resolveOrderPrice(admin, product.id, price)

    // Insert order in database (using service_role to bypass RLS)
    const { data: order, error: insertError } = await admin
      .from('orders')
      .insert({
        product_id: product.id,
        buyer_id: profileId,
        shopper_id: product.shopper_id,
        amount,
        status: 'pending',
        notes: 'Placed via Telegram Mini App',
      } as any)
      .select('id')
      .single()

    if (insertError || !order) {
      throw new Error(insertError?.message || 'Failed to place order.')
    }

    createdOrderIds.push(order.id)

    // Emit bot events
    await emitTelegramEvent('admin', 'NEW_ORDER', { orderId: order.id, amount }, { idempotencyKey: `order-${order.id}` })
    await emitTelegramEvent('customer', 'ORDER_PLACED', { orderId: order.id, amount }, {
      targetProfileId: profileId,
      idempotencyKey: `order-placed-${order.id}`,
    })
    await emitTelegramEvent('customer', 'ORDER_RECEIVED', { orderId: order.id, amount }, {
      targetProfileId: product.shopper_id,
      idempotencyKey: `order-received-${order.id}`,
    })
  }

  // 5. Clear cart
  await admin.from('cart_items').delete().eq('user_id', profileId)

  // 6. Log activity
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', profileId).single()
  await logUserAction({
    userId: profileId,
    userName: profile?.full_name ?? 'Telegram User',
    actionType: 'create_order',
    entityType: 'order',
    description: `Placed ${createdOrderIds.length} order(s) via Telegram Mini App.`
  })

  return {
    success: true,
    orderIds: createdOrderIds,
  }
}
