import { Bot } from 'grammy'
import type { CustomerBotContext } from '../../core/types'
import { getTelegramSupabase } from '../../core/supabase-admin'
import { sendTelegramProductCards } from '../../core/telegram-format'
import { searchCatalogProducts } from '@/lib/utils/product-search'
import { extractShoppingIntent, answerCustomerFAQ } from '../../../gemini/shopping-assistant'

const BUTTON_TEXTS = new Set([
  '🔍 Search Products',
  '⚡ Flash Deals',
  '📦 My Orders',
  '💬 Support Ticket',
  '⚙️ Profile / Link Account',
])

export function registerSearchFlow(bot: Bot<CustomerBotContext>) {
  bot.command('search', async (ctx) => {
    await ctx.reply(
      '🔍 <b>Product Search</b>\n\nType what you are looking for below (e.g. <i>gaming laptop under 80000 ETB</i>):',
      { parse_mode: 'HTML', reply_markup: { force_reply: true, selective: true } }
    )
  })

  bot.on('message:text', async (ctx, next) => {
    const text = ctx.message.text.trim()
    if (text.startsWith('/')) return next()
    if (BUTTON_TEXTS.has(text)) return next()

    const replyToText = ctx.message.reply_to_message?.text
    
    // Check if this is an explicit search reply
    const isSearchReply = replyToText?.includes('Product Search') || replyToText?.includes('What are you looking for')

    // Check if this is an FAQ question
    const isFaq =
      /^(how|where|what is|when|why)\b/i.test(text) &&
      !/\d+\s*etb/i.test(text) &&
      text.endsWith('?')

    if (!isSearchReply && !isFaq) {
      return next()
    }

    await ctx.replyWithChatAction('typing')

    if (isFaq) {
      const answer = await answerCustomerFAQ(text)
      return ctx.reply(answer, { parse_mode: 'HTML' })
    }

    const intent = await extractShoppingIntent(text)
    let available
    let soldOut
    try {
      const result = await searchCatalogProducts(getTelegramSupabase(), {
        query: intent.keywords?.length ? intent.keywords.join(' ') : text,
        category: intent.category,
        minPrice: intent.minPrice,
        maxPrice: intent.maxPrice,
        sortBy: intent.sortBy,
        limit: 3,
      })
      available = result.available
      soldOut = result.soldOut
    } catch {
      return ctx.reply('❌ Search error. Try again.')
    }

    if (!available.length) {
      if (soldOut.length > 0) {
        const soldOutNames = soldOut
          .slice(0, 3)
          .map((p) => p.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
          .join(', ')
        return ctx.reply(
          `😕 Matching item(s) (<b>${soldOutNames}</b>) are currently sold out. Try /deals or different keywords.`,
          { parse_mode: 'HTML' }
        )
      }
      return ctx.reply('😕 No products found. Try /deals or different keywords.', { parse_mode: 'HTML' })
    }

    await ctx.reply(`🔍 <b>Found ${available.length} product(s)</b>`, { parse_mode: 'HTML' })

    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
    await sendTelegramProductCards(ctx, available, BASE_URL)
  })
}
