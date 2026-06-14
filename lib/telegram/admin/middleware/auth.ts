import { NextFunction } from 'grammy'
import { getTelegramSupabase } from '../../core/supabase-admin'
import { checkRateLimit, rateLimitMessage } from '../../core/rate-limit'
import { auditTelegramAction } from '../../core/logger'
import type { AdminBotContext } from '../../core/types'

export async function authMiddleware(ctx: AdminBotContext, next: NextFunction) {
  if (!ctx.chat || !ctx.from) return

  const chatId = ctx.chat.id
  const start = Date.now()
  ctx.correlationId = `${chatId}-${Date.now()}`

  if (!(await checkRateLimit(chatId))) {
    await ctx.reply(rateLimitMessage(), { parse_mode: 'HTML' })
    return
  }

  const envAdminId = process.env.ADMIN_CHAT_ID ? parseInt(process.env.ADMIN_CHAT_ID, 10) : null
  if (envAdminId && chatId === envAdminId) {
    ctx.isAdmin = true
    ctx.adminRole = 'admin'
    await next()
    return
  }

  try {
    const supabase = getTelegramSupabase()
    const { data: admin, error } = await supabase
      .from('telegram_admins')
      .select('is_approved, role')
      .eq('telegram_chat_id', chatId)
      .maybeSingle()

    if (error) {
      console.error(`[Auth] Supabase error: ${error.message}`)
    }

    ctx.isAdmin = !!(admin && admin.is_approved)
    if (ctx.isAdmin && admin) {
      ctx.adminRole = admin.role as 'admin' | 'staff'
    }
  } catch {
    ctx.isAdmin = false
  }

  await next()

  const command = ctx.message?.text?.split(' ')[0]
  if (command?.startsWith('/')) {
    auditTelegramAction({
      bot: 'admin',
      chatId,
      command,
      role: ctx.adminRole,
      result: ctx.isAdmin ? 'success' : 'denied',
      durationMs: Date.now() - start,
    }).catch(() => {})
  }
}

export async function requireAdminRole(ctx: AdminBotContext, next: NextFunction) {
  if (!ctx.isAdmin) {
    const chatId = ctx.chat?.id ?? 0
    const { permissionDeniedMessage } = await import('../../core/rbac')
    return ctx.reply(permissionDeniedMessage(chatId), { parse_mode: 'HTML' })
  }
  if (ctx.adminRole !== 'admin') {
    const { adminOnlyMessage } = await import('../../core/rbac')
    return ctx.reply(adminOnlyMessage(), { parse_mode: 'HTML' })
  }
  await next()
}

// Re-export supabase for gradual migration
export { getTelegramSupabase as supabase } from '../../core/supabase-admin'
