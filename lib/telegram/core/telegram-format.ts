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
  for (const product of products) {
    const productKeyboard = new InlineKeyboard()
      .url('🛒 View & Buy', `${baseUrl}/products/${product.id}`)
      .url('🛍️ Shop All', `${baseUrl}/products`)

    const caption = `📦 <b>${escapeHtml(product.name)}</b>\n💰 ${formatEtb(Number(product.price))}`

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
      await ctx.reply(`📦 ${product.name}\n💰 ${formatEtb(Number(product.price))}`, {
        reply_markup: productKeyboard,
      })
    }
  }
}
