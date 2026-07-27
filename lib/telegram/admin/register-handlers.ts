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
      const store = getStoreName(product.profiles)
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

async function getChatIdForSession(sessionId: string): Promise<number | null> {
  const supabase = getTelegramSupabase()
  const { data: session } = await supabase
    .from('support_sessions')
    .select('user_id, guest_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return null

  if (session.guest_id) {
    const num = Number(session.guest_id)
    if (!isNaN(num)) return num
  }

  if (session.user_id) {
    const { data: tgUser } = await supabase
      .from('telegram_users')
      .select('chat_id')
      .eq('profile_id', session.user_id)
      .maybeSingle()
    if (tgUser?.chat_id) return tgUser.chat_id
  }

  return null
}

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
      text += `• <code>${t.id.slice(0, 8)}</code> — <i>${t.status}</i>\n`
    }
    text += `\n💡 <b>Commands:</b>\n`
    text += `• View chat: <code>/ticket [id]</code>\n`
    text += `• Reply: <code>/reply [id] [message]</code>\n`
    text += `• Close: <code>/close [id]</code>`
    await ctx.reply(text, { parse_mode: 'HTML' })
  })

  bot.command('ticket', async (ctx) => {
    if (!requireStaff(ctx, 'tickets')) return
    const ticketIdPart = ctx.message?.text?.split(/\s+/)[1]?.trim()
    if (!ticketIdPart) {
      return ctx.reply('🎫 Usage: <code>/ticket [id]</code> (e.g. /ticket 78dad116)', { parse_mode: 'HTML' })
    }

    const supabase = getTelegramSupabase()
    const { data: session, error: sessionErr } = await supabase
      .from('support_sessions')
      .select('id, status, created_at, user_id, guest_id')
      .ilike('id', `${ticketIdPart}%`)
      .maybeSingle()

    if (sessionErr || !session) {
      return ctx.reply('❌ Ticket not found.', { parse_mode: 'HTML' })
    }

    const { data: messages, error: msgsErr } = await supabase
      .from('support_messages')
      .select('sender_type, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })

    if (msgsErr) {
      return ctx.reply('❌ Error fetching ticket messages.', { parse_mode: 'HTML' })
    }

    let text = `🎫 <b>Ticket #${session.id.slice(0, 8)}</b>\n`
    text += `Status: <b>${session.status}</b>\n`
    text += `User: <code>${session.user_id || `Guest (${session.guest_id})`}</code>\n\n`

    for (const msg of messages ?? []) {
      const sender = msg.sender_type === 'user' ? '👤 Customer' : msg.sender_type === 'admin' ? '👑 Admin' : '🤖 Bot'
      const time = new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      text += `<b>${sender}</b> (${time}):\n${escapeHtml(msg.content)}\n\n`
    }

    text += `💡 Reply with: <code>/reply ${session.id.slice(0, 8)} [message]</code>`
    await ctx.reply(text, { parse_mode: 'HTML' })
  })

  bot.command('reply', async (ctx) => {
    if (!requireStaff(ctx, 'tickets')) return
    const parts = ctx.message?.text?.split(/\s+/) ?? []
    const ticketIdPart = parts[1]?.trim()
    const replyText = parts.slice(2).join(' ').trim()

    if (!ticketIdPart || !replyText) {
      return ctx.reply('🎫 Usage: <code>/reply [id] [message]</code> (e.g. /reply 78dad116 Hello!)', { parse_mode: 'HTML' })
    }

    const supabase = getTelegramSupabase()
    const { data: session, error: sessionErr } = await supabase
      .from('support_sessions')
      .select('id, status')
      .ilike('id', `${ticketIdPart}%`)
      .maybeSingle()

    if (sessionErr || !session) {
      return ctx.reply('❌ Ticket not found.', { parse_mode: 'HTML' })
    }

    const { error: msgErr } = await supabase
      .from('support_messages')
      .insert({
        session_id: session.id,
        sender_type: 'admin',
        content: replyText,
      })

    if (msgErr) {
      return ctx.reply('❌ Error saving message.', { parse_mode: 'HTML' })
    }

    const chat_id = await getChatIdForSession(session.id)
    if (chat_id) {
      const { emitTelegramEvent } = await import('../notifications/templates')
      emitTelegramEvent('customer', 'TICKET_REPLY', {
        ticketId: session.id,
        message: replyText,
        targetChatId: chat_id,
      })

      // Trigger queue processor immediately in background for instant reply delivery!
      import('../notifications/queue-processor')
        .then((m) => m.processNotificationQueue(25))
        .catch((err) => console.error('[Support Reply Queue Trigger] Error:', err))
    }

    await ctx.reply(`✅ Message sent to ticket <code>${session.id.slice(0, 8)}</code>.`, { parse_mode: 'HTML' })
  })

  bot.command('close', async (ctx) => {
    if (!requireStaff(ctx, 'tickets')) return
    const ticketIdPart = ctx.message?.text?.split(/\s+/)[1]?.trim()
    if (!ticketIdPart) {
      return ctx.reply('🎫 Usage: <code>/close [id]</code> (e.g. /close 78dad116)', { parse_mode: 'HTML' })
    }

    const supabase = getTelegramSupabase()
    const { data: session, error: sessionErr } = await supabase
      .from('support_sessions')
      .select('id')
      .ilike('id', `${ticketIdPart}%`)
      .maybeSingle()

    if (sessionErr || !session) {
      return ctx.reply('❌ Ticket not found.', { parse_mode: 'HTML' })
    }

    const { error: updateErr } = await supabase
      .from('support_sessions')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', session.id)

    if (updateErr) {
      return ctx.reply('❌ Error closing ticket.', { parse_mode: 'HTML' })
    }

    await ctx.reply(`✅ Ticket <code>${session.id.slice(0, 8)}</code> has been closed.`, { parse_mode: 'HTML' })
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
      .select(`
        id,
        amount,
        status,
        payment_type,
        profiles:shopper_id (
          shopper_profiles ( business_name )
        )
      `)
      .eq('status', 'pending')
      .limit(5)

    if (error) return ctx.reply('❌ Error fetching payment requests.', { parse_mode: 'HTML' })
    if (!data?.length) return ctx.reply('✅ No pending payment requests.', { parse_mode: 'HTML' })

    for (const req of data) {
      const store = getStoreName(req.profiles)
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

  bot.command('close_ticket', async (ctx) => {
    const adminChatId = ctx.chat?.id
    if (!adminChatId) return

    const supabase = getTelegramSupabase()
    const { data: claimedSession } = await supabase
      .from('support_sessions')
      .select('id, guest_id, user_id')
      .eq('assigned_staff_tg_chat_id', adminChatId)
      .neq('status', 'closed')
      .maybeSingle()

    if (!claimedSession) {
      return ctx.reply('❌ You do not have any active claimed tickets.', { parse_mode: 'HTML' })
    }

    await supabase
      .from('support_sessions')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimedSession.id)

    // Notify customer
    let customerChatId: number | null = null
    if (claimedSession.guest_id) {
      const num = Number(claimedSession.guest_id)
      if (!isNaN(num)) customerChatId = num
    }
    if (!customerChatId && claimedSession.user_id) {
      const { data: tgUser } = await supabase
        .from('telegram_users')
        .select('chat_id')
        .eq('profile_id', claimedSession.user_id)
        .maybeSingle()
      if (tgUser?.chat_id) customerChatId = tgUser.chat_id
    }

    if (customerChatId) {
      const { customerBot } = await import('../customer/bot')
      await customerBot.api.sendMessage(
        customerChatId,
        `🎫 <b>Your support session (Ticket #${claimedSession.id.slice(0, 8)}) has been closed.</b>\n\nYou are now chatting with our AI Assistant!`,
        { parse_mode: 'HTML' }
      )
    }

    await ctx.reply(`✅ <b>Support session closed.</b> You have released the claim.`, { parse_mode: 'HTML' })
  })

  bot.command('demand', async (ctx) => {
    if (!requireStaff(ctx, 'analytics')) return
    const supabase = getTelegramSupabase()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: logs, error } = await supabase
      .from('search_logs')
      .select('query')
      .eq('results_count', 0)
      .gt('created_at', sevenDaysAgo)

    if (error) {
      return ctx.reply('❌ Error fetching demand logs.', { parse_mode: 'HTML' })
    }

    if (!logs || logs.length === 0) {
      return ctx.reply('✅ No zero-result searches in the last 7 days!', { parse_mode: 'HTML' })
    }

    const counts: Record<string, number> = {}
    for (const log of logs) {
      const term = log.query.toLowerCase().trim()
      counts[term] = (counts[term] || 0) + 1
    }

    const sortedDemand = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    let text = `📈 <b>Lost Demand Report (Last 7 Days)</b>\n`
    text += `<i>Top searches with zero results:</i>\n\n`
    for (const [term, count] of sortedDemand) {
      text += `• <b>${escapeHtml(term)}</b> — <code>${count} searches</code>\n`
    }
    
    await ctx.reply(text, { parse_mode: 'HTML' })
  })

  bot.callbackQuery(/^claim_ticket:(.+)$/, async (ctx) => {
    const ticketId = ctx.match[1]
    const adminChatId = ctx.chat?.id
    if (!adminChatId) return

    const supabase = getTelegramSupabase()

    const { data: session } = await supabase
      .from('support_sessions')
      .select('id, status, assigned_staff_tg_chat_id')
      .eq('id', ticketId)
      .maybeSingle()

    if (!session) {
      return ctx.answerCallbackQuery({ text: '❌ Ticket not found.', show_alert: true })
    }

    if (session.status === 'closed') {
      return ctx.answerCallbackQuery({ text: '❌ This ticket is already closed.', show_alert: true })
    }

    if (session.assigned_staff_tg_chat_id) {
      if (session.assigned_staff_tg_chat_id === adminChatId) {
        return ctx.answerCallbackQuery({ text: 'You have already claimed this ticket.', show_alert: true })
      } else {
        return ctx.answerCallbackQuery({ text: '❌ Already claimed by another admin.', show_alert: true })
      }
    }

    const { error: claimErr } = await supabase
      .from('support_sessions')
      .update({
        assigned_staff_tg_chat_id: adminChatId,
        status: 'human',
      })
      .eq('id', ticketId)

    if (claimErr) {
      return ctx.answerCallbackQuery({ text: '❌ Failed to claim ticket.', show_alert: true })
    }

    await ctx.answerCallbackQuery({ text: '✅ Ticket claimed! You are now in human takeover mode.' })
    await ctx.reply(`🙋‍♂️ <b>You have claimed Ticket #${ticketId.slice(0, 8)}.</b>\n\nAny message you type now (that doesn't start with /) will be forwarded directly to the customer.\n\nUse /close_ticket to end the takeover.`, { parse_mode: 'HTML' })
  })

  bot.on('message:text', async (ctx, next) => {
    const text = ctx.message.text
    if (text.startsWith('/')) return next()

    const adminChatId = ctx.chat?.id
    if (adminChatId) {
      const supabase = getTelegramSupabase()
      
      const { data: claimedSession } = await supabase
        .from('support_sessions')
        .select('id, guest_id, user_id')
        .eq('assigned_staff_tg_chat_id', adminChatId)
        .neq('status', 'closed')
        .maybeSingle()

      if (claimedSession) {
        await supabase.from('support_messages').insert({
          session_id: claimedSession.id,
          sender_type: 'admin',
          content: text,
        })

        let customerChatId: number | null = null
        if (claimedSession.guest_id) {
          const num = Number(claimedSession.guest_id)
          if (!isNaN(num)) customerChatId = num
        }
        if (!customerChatId && claimedSession.user_id) {
          const { data: tgUser } = await supabase
            .from('telegram_users')
            .select('chat_id')
            .eq('profile_id', claimedSession.user_id)
            .maybeSingle()
          if (tgUser?.chat_id) customerChatId = tgUser.chat_id
        }

        if (customerChatId) {
          const { customerBot } = await import('../customer/bot')
          await customerBot.api.sendMessage(
            customerChatId,
            `💬 <b>Support Reply:</b>\n\n${escapeHtml(text)}`,
            { parse_mode: 'HTML' }
          )
          await ctx.reply(`✉️ <b>Message forwarded to customer.</b>`, { parse_mode: 'HTML' })
        } else {
          await ctx.reply(`❌ Could not resolve customer Telegram Chat ID for this session.`, { parse_mode: 'HTML' })
        }
        return
      }
    }

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
        
        // Trigger queue processor immediately in background
        import('../notifications/queue-processor')
          .then((m) => m.processNotificationQueue(50))
          .catch((err) => console.error('[Broadcast Queue Trigger] Error:', err))

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
