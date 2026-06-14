import { Keyboard } from 'grammy'
import type { Bot } from 'grammy'
import type { CustomerBotContext } from '../core/types'
import { handleLinkPrompt, registerAuthFlow } from './flows/auth.flow'
import { handleSupportPrompt, registerSupportFlow } from './flows/support.flow'
import { handleOrders, registerOrdersFlow } from './flows/orders.flow'
import { handleDeals, registerDealsFlow } from './flows/deals.flow'
import { registerSearchFlow } from './flows/search.flow'

export const mainMenu = new Keyboard()
  .text('🔍 Search Products')
  .text('⚡ Flash Deals')
  .row()
  .text('📦 My Orders')
  .text('💬 Support Ticket')
  .row()
  .text('⚙️ Profile / Link Account')
  .resized()
  .persistent()

export function registerCustomerHandlers(bot: Bot<CustomerBotContext>) {
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '👋 <b>Welcome to KelalShop!</b> 🛍️\n\n' +
        'Your shopping assistant — search products, track orders, get support.\n\n' +
        '👇 Use the menu below to get started.',
      { parse_mode: 'HTML', reply_markup: mainMenu }
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '🛍️ <b>Help</b>\n\n' +
        '• /orders — Your orders\n' +
        '• /track — Active orders\n' +
        '• /deals — Flash sales\n' +
        '• /search — Find products\n' +
        '• /support — Support ticket\n' +
        '• /link — Link account\n\n' +
        '🤖 Or describe what you need naturally!',
      { parse_mode: 'HTML', reply_markup: mainMenu }
    )
  })

  registerAuthFlow(bot)
  registerSupportFlow(bot)
  registerOrdersFlow(bot)
  registerDealsFlow(bot)

  bot.hears('🔍 Search Products', async (ctx) => {
    await ctx.reply('🔍 What are you looking for? Type a product name or description.', { parse_mode: 'HTML' })
  })
  bot.hears('⚡ Flash Deals', handleDeals)
  bot.hears('📦 My Orders', handleOrders)
  bot.hears('💬 Support Ticket', handleSupportPrompt)
  bot.hears('⚙️ Profile / Link Account', handleLinkPrompt)

  registerSearchFlow(bot)

  bot.on('message:text', async (ctx) => {
    await ctx.reply(
      'Try /search for products or /support for help.',
      { parse_mode: 'HTML', reply_markup: mainMenu }
    )
  })
}
