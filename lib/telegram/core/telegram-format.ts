import { InlineKeyboard } from 'grammy'

export function formatEtb(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} ETB`
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function truncateId(id: string, len = 8): string {
  return id.slice(0, len)
}

/** Sends interactive Telegram product cards with safe HTML escaping and image fallback. */
export async function sendTelegramProductCards(
  ctx: any,
  products: Array<{ id: string; name: string; price: number; image?: string | null }>,
  baseUrl: string
): Promise<void> {
  const safeWebUrl = !baseUrl || baseUrl.includes('localhost') ? 'https://kelalshop.com' : baseUrl

  for (const product of products) {
    const isOnCall = Number(product.price) === 0 || (product as any).price_type === 'on_call' || (product as any).attributes?.price_type === 'on_call'

    const productKeyboard = new InlineKeyboard()
    if (!isOnCall) {
      productKeyboard.text('⚡ Buy in Telegram', `buy_prod_${product.id}`).row()
    } else {
      productKeyboard.url('📞 Contact Seller', `${safeWebUrl}/products/${product.id}?contact=open`).row()
    }
    productKeyboard
      .url('🌐 View on Website', `${safeWebUrl}/products/${product.id}`)
      .url('📦 More Qty / Bulk', `${safeWebUrl}/products/${product.id}`)

    const caption =
      `🛍️ <b>${escapeHtml(product.name)}</b>\n` +
      `💰 Price: <b>${isOnCall ? 'Price on Call' : formatEtb(Number(product.price))}</b>\n` +
      `✨ <i>Verified &amp; Available on KelalShop</i>`

    if (product.image) {
      try {
        await ctx.replyWithPhoto(product.image, {
          caption,
          parse_mode: 'HTML',
          reply_markup: productKeyboard,
        })
        continue
      } catch (err: any) {
        console.warn('[sendTelegramProductCards] Photo send failed, falling back to text:', err?.message || err)
      }
    }

    try {
      await ctx.reply(caption, {
        parse_mode: 'HTML',
        reply_markup: productKeyboard,
      })
    } catch {
      await ctx.reply(`🛍️ ${product.name}\n💰 ${formatEtb(Number(product.price))}`, {
        reply_markup: productKeyboard,
      })
    }
  }
}
