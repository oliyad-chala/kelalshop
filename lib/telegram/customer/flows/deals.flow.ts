import { InlineKeyboard, Bot } from 'grammy'
import type { CustomerBotContext } from '../../core/types'
import { getTelegramSupabase } from '../../core/supabase-admin'

export async function handleDeals(ctx: CustomerBotContext) {
  await ctx.replyWithChatAction('typing')
  const now = new Date().toISOString()

  const { data: promotions, error } = await getTelegramSupabase()
    .from('promotions')
    .select('id, name, discount_percentage, end_date, type')
    .eq('is_active', true)
    .eq('status', 'active')
    .eq('type', 'flash_sale_campaign')
    .lte('start_date', now)
    .gte('end_date', now)
    .order('discount_percentage', { ascending: false })
    .limit(5)

  if (error || !promotions?.length) {
    return ctx.reply('✅ No active flash sales right now. Check back later!')
  }

  await ctx.reply(`⚡ <b>Active Flash Deals</b> — ${promotions.length} found`, { parse_mode: 'HTML' })

  for (const promo of promotions) {
    const keyboard = new InlineKeyboard().url('🛒 View Deals', `https://kelalshop.com/promotions/${promo.id}`)
    await ctx.reply(
      `⚡ <b>${promo.name}</b>\n💥 Up to <b>${promo.discount_percentage ?? 0}%</b> off`,
      { parse_mode: 'HTML', reply_markup: keyboard }
    )
  }
}

export function registerDealsFlow(bot: Bot<CustomerBotContext>) {
  bot.command('deals', handleDeals)
}
