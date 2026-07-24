import { InlineKeyboard, Bot } from 'grammy'
import type { CustomerBotContext } from '../../core/types'
import { getTelegramSupabase } from '../../core/supabase-admin'
import { formatEtb } from '../../core/telegram-format'
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
    let query = getTelegramSupabase()
      .from('products')
      .select('id, name, price')
      .eq('is_available', true)
      .eq('approval_status', 'approved')

    if (intent.keywords?.length) {
      query = query.ilike('name', `%${intent.keywords.join('%')}%`)
    }
    if (intent.minPrice) query = query.gte('price', intent.minPrice)
    if (intent.maxPrice) query = query.lte('price', intent.maxPrice)

    if (intent.sortBy === 'price_asc') query = query.order('price', { ascending: true })
    else if (intent.sortBy === 'price_desc') query = query.order('price', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data: products, error } = await query.limit(3)
    if (error) return ctx.reply('❌ Search error. Try again.')
    if (!products?.length) {
      return ctx.reply('😕 No products found. Try /deals or different keywords.', { parse_mode: 'HTML' })
    }

    await ctx.reply(`🔍 <b>Found ${products.length} product(s)</b>`, { parse_mode: 'HTML' })

    for (const product of products) {
      const keyboard = new InlineKeyboard()
        .url('🛒 View', `https://kelalshop.com/products/${product.id}`)
        .url('🛍️ Shop', 'https://kelalshop.com/products')
      await ctx.reply(`📦 <b>${product.name}</b>\n💰 ${formatEtb(Number(product.price))}`, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      })
    }
  })
}
