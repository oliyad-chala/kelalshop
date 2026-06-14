import { handleAdminGeminiQuery } from '../ai/admin-assistant'
import type { AdminBotContext } from '../core/types'
import { hasPermission, permissionDeniedMessage, adminOnlyMessage } from '../core/rbac'
import type { AdminPermission } from '../core/rbac'
import {
  getDashboardMetrics,
  getAnalyticsReport,
  formatDashboardHtml,
  formatAnalyticsHtml,
} from './services/analytics.service'
import {
  getProductCount,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getStoreName,
} from './services/products.service'
import { getTelegramSupabase } from '../core/supabase-admin'
import { formatEtb, escapeHtml, truncateId } from '../core/telegram-format'
import { InlineKeyboard } from 'grammy'
import type { Bot } from 'grammy'

function requireStaff(ctx: AdminBotContext, permission: AdminPermission): boolean {
  if (!ctx.isAdmin) {
    ctx.reply(permissionDeniedMessage(ctx.chat?.id ?? 0), { parse_mode: 'HTML' })
    return false
  }
  if (!hasPermission(ctx.adminRole, permission)) {
    ctx.reply(adminOnlyMessage(), { parse_mode: 'HTML' })
    return false
  }
  return true
}

export function registerAdminHandlers(bot: Bot<AdminBotContext>) {
  bot.command('start', async (ctx) => {
    if (ctx.isAdmin) {
      const role = ctx.adminRole === 'admin' ? 'Super Admin' : 'Staff'
      await ctx.reply(
        `👋 <b>Welcome back to KelalShop Admin Bot!</b>\n\n` +
          `Authenticated as: <b>${role}</b>\n` +
          `Use /help for commands or ask a question for AI assistance.`,
        { parse_mode: 'HTML' }
      )
    } else {
      await ctx.reply(
        `👋 <b>KelalShop Admin Bot</b>\n\n` +
          permissionDeniedMessage(ctx.chat?.id ?? 0),
        { parse_mode: 'HTML' }
      )
    }
  })

  bot.command('help', async (ctx) => {
    if (!requireStaff(ctx, 'dashboard')) return

    let text =
      `🔒 <b>Commands</b>\n` +
      `/dashboard — Live stats\n` +
      `/orders — Today's orders\n` +
      `/products — Product count\n` +
      `/pending — Pending approvals\n` +
      `/sellers — Pending sellers\n` +
      `/users — User stats\n` +
      `/tickets — Open support tickets\n` +
      `/search — Search products & orders\n`

    if (ctx.adminRole === 'admin') {
      text +=
        `\n👑 <b>Admin Only</b>\n` +
        `/revenue — Revenue summary\n` +
        `/analytics — Full analytics\n` +
        `/withdrawals — Pending payment requests\n` +
        `/staff — Staff directory\n` +
        `/security — Security alerts\n` +
        `/broadcast — Message all users\n`
    }

    text += `\n🤖 <b>AI</b> — Ask naturally, e.g. "Show revenue summary"`
    await ctx.reply(text, { parse_mode: 'HTML' })
  })

  bot.command('dashboard', async (ctx) => {
    if (!requireStaff(ctx, 'dashboard')) return
    const m = await getDashboardMetrics()
    const keyboard = new InlineKeyboard()
      .text('🔄 Refresh', 'refresh_dashboard')
      .row()
      .text('⏳ Pending', 'cmd_pending')
      .text('🎫 Tickets', 'cmd_tickets')
    await ctx.reply(formatDashboardHtml(m), { parse_mode: 'HTML', reply_markup: keyboard })
  })

  bot.callbackQuery('refresh_dashboard', async (ctx) => {
    if (!ctx.isAdmin) return ctx.answerCallbackQuery({ text: 'Access denied' })
    const m = await getDashboardMetrics()
    const keyboard = new InlineKeyboard()
      .text('🔄 Refresh', 'refresh_dashboard')
      .row()
      .text('⏳ Pending', 'cmd_pending')
      .text('🎫 Tickets', 'cmd_tickets')
    await ctx.editMessageText(formatDashboardHtml(m), { parse_mode: 'HTML', reply_markup: keyboard })
    await ctx.answerCallbackQuery({ text: 'Refreshed!' })
  })

  bot.callbackQuery('cmd_pending', async (ctx) => {
    await ctx.answerCallbackQuery({ text: 'Use /pending' })
  })

  bot.callbackQuery('cmd_tickets', async (ctx) => {
    await ctx.answerCallbackQuery({ text: 'Use /tickets' })
  })

  bot.command('orders', async (ctx) => {
    if (!requireStaff(ctx, 'orders')) return
    const supabase = getTelegramSupabase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, count, error } = await supabase
      .from('orders')
      .select('id, amount, status', { count: 'exact' })
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) return ctx.reply('❌ Error fetching orders.', { parse_mode: 'HTML' })

    if (!count) {
      return ctx.reply('📦 No orders today.', { parse_mode: 'HTML' })
    }

    let text = `📦 <b>Today's Orders (${count})</b>\n\n`
    for (const o of data ?? []) {
      text += `• #${truncateId(o.id)} — ${formatEtb(Number(o.amount))} — <i>${o.status}</i>\n`
    }
    await ctx.reply(text, { parse_mode: 'HTML' })
  })

  bot.command('products', async (ctx) => {
    if (!requireStaff(ctx, 'products')) return
    const { count, error } = await getProductCount()
    if (error) return ctx.reply('❌ Error fetching products.', { parse_mode: 'HTML' })
    await ctx.reply(`📦 <b>Total Products:</b> ${count}`, { parse_mode: 'HTML' })
  })

  bot.command('pending', async (ctx) => {
    if (!requireStaff(ctx, 'pending')) return
    const { data, error } = await getPendingProducts(5)
    if (error) return ctx.reply('❌ Error fetching pending products.', { parse_mode: 'HTML' })
    if (!data?.length) return ctx.reply('✅ No pending products.', { parse_mode: 'HTML' })

    for (const product of data) {
      const store = getStoreName(product.shopper_profiles)
      const keyboard = new InlineKeyboard()
        .text('✅ Approve', `approve_product_${product.id}`)
        .text('❌ Reject', `reject_product_${product.id}`)
      await ctx.reply(
        `📦 <b>${escapeHtml(product.name)}</b>\nSeller: ${escapeHtml(store)} | ${formatEtb(Number(product.price))}`,
        { parse_mode: 'HTML', reply_markup: keyboard }
      )
    }
  })

  bot.callbackQuery(/approve_product_(.*)/, async (ctx) => {
    if (!ctx.isAdmin) return ctx.answerCallbackQuery({ text: 'Access denied' })
    const productId = ctx.match[1]
    const { error } = await approveProduct(productId)
    if (error) return ctx.answerCallbackQuery({ text: 'Error approving' })
    await ctx.editMessageText('✅ Product approved.')
    await ctx.answerCallbackQuery({ text: 'Approved!' })
  })

  bot.callbackQuery(/reject_product_(.*)/, async (ctx) => {
    if (!ctx.isAdmin) return ctx.answerCallbackQuery({ text: 'Access denied' })
    const productId = ctx.match[1]
    const { error } = await rejectProduct(productId)
    if (error) return ctx.answerCallbackQuery({ text: 'Error rejecting' })
    await ctx.editMessageText('❌ Product rejected.')
    await ctx.answerCallbackQuery({ text: 'Rejected!' })
  })

  bot.command('sellers', async (ctx) => {
    if (!requireStaff(ctx, 'sellers')) return
    const supabase = getTelegramSupabase()
    const { count, error } = await supabase
      .from('shopper_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending')
    if (error) return ctx.reply('❌ Error fetching sellers.', { parse_mode: 'HTML' })
    if (!count) return ctx.reply('✅ No pending seller applications.', { parse_mode: 'HTML' })
    await ctx.reply(`🏪 <b>Pending Sellers:</b> ${count}\nReview in the web admin dashboard.`, { parse_mode: 'HTML' })
  })

  bot.command('users', async (ctx) => {
    if (!requireStaff(ctx, 'users')) return
    const supabase = getTelegramSupabase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const week = new Date(today)
    week.setDate(week.getDate() - 7)

    const [{ count: total }, { count: todayCount }, { count: weekCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', week.toISOString()),
    ])

    await ctx.reply(
      `👥 <b>Users</b>\n\nTotal: <b>${total ?? 0}</b>\nNew today: <b>${todayCount ?? 0}</b>\nNew this week: <b>${weekCount ?? 0}</b>`,
      { parse_mode: 'HTML' }
    )
  })

  bot.command('tickets', async (ctx) => {
    if (!requireStaff(ctx, 'tickets')) return
    const supabase = getTelegramSupabase()
    const { data, error } = await supabase
      .from('support_sessions')
      .select('id, status, created_at, user_id')
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) return ctx.reply('❌ Error fetching tickets.', { parse_mode: 'HTML' })
    if (!data?.length) return ctx.reply('✅ No open support tickets.', { parse_mode: 'HTML' })

    let text = `🎫 <b>Open Tickets (${data.length})</b>\n\n`
    for (const t of data) {
      text += `• #${truncateId(t.id)} — <i>${t.status}</i>\n`
    }
    await ctx.reply(text, { parse_mode: 'HTML' })
  })

  bot.command('search', async (ctx) => {
    if (!requireStaff(ctx, 'search')) return
    const query = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim() ?? ''
    if (!query) {
      return ctx.reply('🔍 Usage: <code>/search laptop</code> or <code>/search order abc123</code>', { parse_mode: 'HTML' })
    }
    const supabase = getTelegramSupabase()
    const q = `%${query}%`

    const [{ data: products }, { data: orders }] = await Promise.all([
      supabase.from('products').select('id, name, price').ilike('name', q).eq('approval_status', 'approved').limit(5),
      supabase.from('orders').select('id, amount, status').ilike('id', q).limit(5),
    ])

    let text = `🔍 <b>Results for "${escapeHtml(query)}"</b>\n\n`
    if (products?.length) {
      text += '<b>Products</b>\n'
      products.forEach((p) => { text += `• ${escapeHtml(p.name)} — ${formatEtb(Number(p.price))}\n` })
    }
    if (orders?.length) {
      text += '\n<b>Orders</b>\n'
      orders.forEach((o) => { text += `• #${truncateId(o.id)} — ${formatEtb(Number(o.amount))} — ${o.status}\n` })
    }
    if (!products?.length && !orders?.length) text += 'No matches found.'
    await ctx.reply(text, { parse_mode: 'HTML' })
  })

  bot.command('revenue', async (ctx) => {
    if (!requireStaff(ctx, 'revenue')) return
    if (ctx.adminRole !== 'admin') return ctx.reply(adminOnlyMessage(), { parse_mode: 'HTML' })

    const report = await getAnalyticsReport()
    await ctx.reply(
      `💰 <b>Revenue</b>\n\nToday: <b>${formatEtb(report.revenueToday)}</b>\nThis week: <b>${formatEtb(report.revenueWeek)}</b>`,
      { parse_mode: 'HTML' }
    )
  })

  bot.command('analytics', async (ctx) => {
    if (!requireStaff(ctx, 'analytics')) return
    if (ctx.adminRole !== 'admin') return ctx.reply(adminOnlyMessage(), { parse_mode: 'HTML' })
    const report = await getAnalyticsReport()
    const keyboard = new InlineKeyboard().text('🔄 Refresh', 'refresh_analytics')
    await ctx.reply(formatAnalyticsHtml(report), { parse_mode: 'HTML', reply_markup: keyboard })
  })

  bot.callbackQuery('refresh_analytics', async (ctx) => {
    if (ctx.adminRole !== 'admin') return ctx.answerCallbackQuery({ text: 'Admin only' })
    const report = await getAnalyticsReport()
    const keyboard = new InlineKeyboard().text('🔄 Refresh', 'refresh_analytics')
    await ctx.editMessageText(formatAnalyticsHtml(report), { parse_mode: 'HTML', reply_markup: keyboard })
    await ctx.answerCallbackQuery({ text: 'Refreshed!' })
  })

  bot.command('withdrawals', async (ctx) => {
    if (!requireStaff(ctx, 'withdrawals')) return
    if (ctx.adminRole !== 'admin') return ctx.reply(adminOnlyMessage(), { parse_mode: 'HTML' })

    const supabase = getTelegramSupabase()
    const { data, error } = await supabase
      .from('payment_requests')
      .select(`id, amount, status, payment_type, shopper_profiles ( business_name )`)
      .eq('status', 'pending')
      .limit(5)

    if (error) return ctx.reply('❌ Error fetching payment requests.', { parse_mode: 'HTML' })
    if (!data?.length) return ctx.reply('✅ No pending payment requests.', { parse_mode: 'HTML' })

    for (const req of data) {
      const store = getStoreName(req.shopper_profiles)
      const keyboard = new InlineKeyboard()
        .text('✅ Approve', `approve_payment_${req.id}`)
        .text('❌ Reject', `reject_payment_${req.id}`)
      await ctx.reply(
        `💸 <b>Payment Request</b>\nStore: ${escapeHtml(store)}\nType: ${escapeHtml(req.payment_type)}\nAmount: ${formatEtb(Number(req.amount))}`,
        { parse_mode: 'HTML', reply_markup: keyboard }
      )
    }
  })

  bot.callbackQuery(/approve_payment_(.*)/, async (ctx) => {
    if (ctx.adminRole !== 'admin') return ctx.answerCallbackQuery({ text: 'Admin only' })
    const id = ctx.match[1]
    const { error } = await getTelegramSupabase().from('payment_requests').update({ status: 'approved' }).eq('id', id)
    if (error) return ctx.answerCallbackQuery({ text: 'Error' })
    await ctx.editMessageText('✅ Payment request approved.')
    await ctx.answerCallbackQuery({ text: 'Approved!' })
  })

  bot.callbackQuery(/reject_payment_(.*)/, async (ctx) => {
    if (ctx.adminRole !== 'admin') return ctx.answerCallbackQuery({ text: 'Admin only' })
    const id = ctx.match[1]
    const { error } = await getTelegramSupabase().from('payment_requests').update({ status: 'rejected' }).eq('id', id)
    if (error) return ctx.answerCallbackQuery({ text: 'Error' })
    await ctx.editMessageText('❌ Payment request rejected.')
    await ctx.answerCallbackQuery({ text: 'Rejected!' })
  })

  bot.command('staff', async (ctx) => {
    if (!requireStaff(ctx, 'staff')) return
    if (ctx.adminRole !== 'admin') return ctx.reply(adminOnlyMessage(), { parse_mode: 'HTML' })

    const { data, error } = await getTelegramSupabase()
      .from('telegram_admins')
      .select('telegram_chat_id, role, is_approved, username')
    if (error) return ctx.reply('❌ Error fetching staff.', { parse_mode: 'HTML' })

    let text = '👥 <b>Staff Directory</b>\n\n'
    for (const s of data ?? []) {
      text += `• <code>${s.telegram_chat_id}</code> — ${s.role} ${s.is_approved ? '✅' : '❌'} ${s.username ? `(${escapeHtml(s.username)})` : ''}\n`
    }
    await ctx.reply(text, { parse_mode: 'HTML' })
  })

  bot.command('security', async (ctx) => {
    if (!requireStaff(ctx, 'security')) return
    if (ctx.adminRole !== 'admin') return ctx.reply(adminOnlyMessage(), { parse_mode: 'HTML' })

    const supabase = getTelegramSupabase()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, count } = await supabase
      .from('login_attempts')
      .select('email, ip_address, is_success, created_at', { count: 'exact' })
      .eq('is_success', false)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!count) {
      return ctx.reply('🔒 <b>Security</b>\n\nNo failed login attempts in the last 24 hours.', { parse_mode: 'HTML' })
    }

    let text = `🔒 <b>Security — ${count} failed logins (24h)</b>\n\n`
    for (const row of data ?? []) {
      text += `• ${escapeHtml(row.email)} from ${escapeHtml(row.ip_address || 'unknown')}\n`
    }
    await ctx.reply(text, { parse_mode: 'HTML' })
  })

  bot.command('broadcast', async (ctx) => {
    if (!requireStaff(ctx, 'broadcast')) return
    if (ctx.adminRole !== 'admin') return ctx.reply(adminOnlyMessage(), { parse_mode: 'HTML' })
    if (!ctx.chat) return

    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    await getTelegramSupabase().from('telegram_broadcast_state').upsert({
      chat_id: ctx.chat.id,
      admin_role: ctx.adminRole,
      step: 'awaiting_message',
      expires_at: expires,
    })
    await ctx.reply('📢 Send the message to broadcast to all linked customers.\nSend /cancel to abort.', { parse_mode: 'HTML' })
  })

  bot.command('cancel', async (ctx) => {
    if (!ctx.chat) return
    await getTelegramSupabase().from('telegram_broadcast_state').delete().eq('chat_id', ctx.chat.id)
    await ctx.reply('✅ Cancelled.', { parse_mode: 'HTML' })
  })

  bot.on('message:text', async (ctx, next) => {
    const text = ctx.message.text
    if (text.startsWith('/')) return next()

    if (ctx.chat && ctx.isAdmin && ctx.adminRole === 'admin') {
      const supabase = getTelegramSupabase()
      const { data: state } = await supabase
        .from('telegram_broadcast_state')
        .select('step, expires_at')
        .eq('chat_id', ctx.chat.id)
        .maybeSingle()

      if (state && new Date(state.expires_at) > new Date()) {
        await supabase.from('telegram_broadcast_state').delete().eq('chat_id', ctx.chat.id)
        const { emitTelegramEvent } = await import('../notifications/templates')
        emitTelegramEvent('customer', 'BROADCAST', { message: text })
        await ctx.reply('✅ Broadcast queued for delivery to all linked customers.', { parse_mode: 'HTML' })
        return
      }
    }

    if (!ctx.isAdmin) return

    if (!hasPermission(ctx.adminRole, 'ai')) return

    try {
      await ctx.replyWithChatAction('typing')
      const response = await handleAdminGeminiQuery(text)
      await ctx.reply(response, { parse_mode: 'HTML' })
    } catch {
      await ctx.reply('🤖 Sorry, I could not process that query. Try /analytics for stats.', { parse_mode: 'HTML' })
    }
  })
}
