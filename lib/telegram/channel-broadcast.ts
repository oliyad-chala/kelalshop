import { Bot, InlineKeyboard } from 'grammy'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatEtb, escapeHtml } from './core/telegram-format'
import { SITE_URL } from '@/lib/seo/site'

/**
 * Automatically publishes an approved product to the configured Telegram Channel.
 * Configured via:
 *   TELEGRAM_CHANNEL_ID: e.g. "@kelalshop" or "-1001234567890"
 *   TELEGRAM_CHANNEL_BOT_TOKEN || TELEGRAM_CUSTOMER_BOT_TOKEN || TELEGRAM_BOT_TOKEN
 */
export async function broadcastProductToTelegramChannel(productId: string): Promise<{
  success: boolean
  messageId?: number
  error?: string
}> {
  const channelId = process.env.TELEGRAM_CHANNEL_ID?.trim()
  if (!channelId) {
    console.log('[Telegram Channel] TELEGRAM_CHANNEL_ID is not set in environment. Skipping broadcast.')
    return { success: false, error: 'TELEGRAM_CHANNEL_ID not configured' }
  }

  const token =
    process.env.TELEGRAM_CHANNEL_BOT_TOKEN?.trim() ||
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    process.env.TELEGRAM_CUSTOMER_BOT_TOKEN?.trim()

  if (!token) {
    console.error('[Telegram Channel] No Telegram bot token found. Skipping broadcast.')
    return { success: false, error: 'No Telegram bot token found' }
  }

  try {
    const admin = createAdminClient()
    const { data: product, error: fetchError } = await admin
      .from('products')
      .select('*, product_images(*), categories(*), profiles:shopper_id(*)')
      .eq('id', productId)
      .single()

    if (fetchError || !product) {
      console.error('[Telegram Channel] Failed to fetch product for broadcast:', fetchError?.message)
      return { success: false, error: fetchError?.message || 'Product not found' }
    }

    const bot = new Bot(token)
    const rawSite = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL
    const siteBase = rawSite.includes('localhost') ? 'https://kelalshop.com' : rawSite

    const sellerName = product.profiles?.full_name || 'Verified Importer'
    const sellerPhone = product.profiles?.phone?.trim() || null
    const location = product.location || product.profiles?.location || 'Addis Ababa, Ethiopia'

    // Format category hashtag
    const categoryName = (product.categories as any)?.name || 'Deals'
    const cleanCategoryTag = categoryName.replace(/[^a-zA-Z0-9]/g, '')

    // Truncate description for Telegram caption (caption max 1024 chars total)
    let desc = (product.description || '').trim()
    if (desc.length > 220) {
      desc = desc.substring(0, 217) + '...'
    }

    // Build attractive, formatted message
    let caption = `✨ <b>New Arrival on KelalShop!</b>\n\n`
    caption += `🛍️ <b>${escapeHtml(product.name)}</b>\n\n`
    caption += `💰 <b>Price:</b> ${formatEtb(product.price)}\n`
    caption += `📍 <b>Location:</b> ${escapeHtml(location)}\n`
    caption += `🏪 <b>Seller:</b> ${escapeHtml(sellerName)}\n`
    if (sellerPhone) {
      caption += `📞 <b>Phone:</b> <code>${escapeHtml(sellerPhone)}</code>\n`
    }

    if (desc) {
      caption += `\n📝 ${escapeHtml(desc)}\n`
    }

    caption += `\n#KelalShop #${cleanCategoryTag} #Ethiopia`

    // Build inline buttons
    const productUrl = `${siteBase}/products/${product.id}`
    const keyboard = new InlineKeyboard().url('🛍️ View on KelalShop', productUrl)

    // Add 2nd button for direct contact if available
    if (sellerPhone) {
      const digitsOnly = sellerPhone.replace(/[^\d]/g, '')
      if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
        keyboard.url('💬 Chat on Telegram', `https://t.me/+251${digitsOnly.slice(1)}`)
      } else if (digitsOnly.startsWith('251') && digitsOnly.length === 12) {
        keyboard.url('💬 Chat on Telegram', `https://t.me/+${digitsOnly}`)
      } else if (product.shopper_id) {
        keyboard.url('🏪 Seller Store', `${siteBase}/shoppers/${product.shopper_id}`)
      }
    } else if (product.shopper_id) {
      keyboard.url('🏪 Seller Store', `${siteBase}/shoppers/${product.shopper_id}`)
    }

    // Determine primary image
    const images = (product.product_images as any[]) || []
    const primaryImage = images.find((img) => img.is_primary)?.url || images[0]?.url

    let sentMessage
    if (primaryImage && primaryImage.startsWith('http')) {
      sentMessage = await bot.api.sendPhoto(channelId, primaryImage, {
        caption,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      })
    } else {
      sentMessage = await bot.api.sendMessage(channelId, caption, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      })
    }

    console.log(`[Telegram Channel] Successfully posted product "${product.name}" to channel ${channelId} (msg: ${sentMessage.message_id})`)
    return { success: true, messageId: sentMessage.message_id }
  } catch (err: any) {
    console.error('[Telegram Channel] Broadcast error:', err?.message || err)
    return { success: false, error: err?.message || 'Unknown Telegram API error' }
  }
}
