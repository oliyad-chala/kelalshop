import { createClient } from '@supabase/supabase-js'
import { getTelegramSupabase } from '../../core/supabase-admin'
import { checkOtpRateLimit } from '../../core/rate-limit'

async function findProfileByEmail(email: string): Promise<string | null> {
  const supabase = getTelegramSupabase()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return null

  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  return profile?.id ?? user.id
}

async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'KelalShop <noreply@kelalshop.com>',
          to: email,
          subject: 'Your KelalShop Telegram Link Code',
          html: `<p>Your verification code is: <strong>${otp}</strong></p><p>Expires in 10 minutes.</p>`,
        }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  console.log(`\n========================================`)
  console.log(`🔐 OTP for ${email}: ${otp}`)
  console.log(`========================================\n`)
  return process.env.NODE_ENV === 'development'
}

export async function handleLinkPrompt(ctx: import('../core/types').CustomerBotContext) {
  await ctx.reply(
    '🔗 <b>Account Linking</b>\n\nEnter the email for your KelalShop account:',
    { parse_mode: 'HTML', reply_markup: { force_reply: true, selective: true } }
  )
}

export function registerAuthFlow(bot: import('grammy').Bot<import('../core/types').CustomerBotContext>) {
  bot.command('link', handleLinkPrompt)

  bot.on('message:text', async (ctx, next) => {
    const text = ctx.message.text.trim()
    const replyToText = ctx.message.reply_to_message?.text

    if (replyToText?.includes('Enter the email')) {
      if (!text.includes('@')) {
        return ctx.reply('❌ Invalid email. Try again.')
      }
      if (!ctx.chat || !(await checkOtpRateLimit(ctx.chat.id))) {
        return ctx.reply('⏳ Too many attempts. Wait an hour and try /link again.')
      }

      const profileId = await findProfileByEmail(text)
      if (!profileId) {
        return ctx.reply('❌ No account found with that email. Register on kelalshop.com first.')
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

      const { error: upsertError } = await getTelegramSupabase().from('telegram_users').upsert(
        {
          chat_id: ctx.chat.id,
          profile_id: profileId,
          username: ctx.from?.username,
          first_name: ctx.from?.first_name,
          otp_code: otp,
          otp_expires_at: expiresAt,
          otp_attempts: 0,
          is_verified: false,
        },
        { onConflict: 'chat_id' }
      )

      if (upsertError) {
        return ctx.reply('❌ Error starting link session. Try again later.')
      }

      const sent = await sendOtpEmail(text, otp)
      if (!sent) {
        return ctx.reply('❌ Could not send OTP email. Contact support or try again later.')
      }

      return ctx.reply(
        '✅ A 6-digit code was sent to your email.\n\nEnter the code below:',
        { parse_mode: 'HTML', reply_markup: { force_reply: true, selective: true } }
      )
    }

    if (replyToText?.includes('6-digit code') || replyToText?.includes('Enter the code')) {
      const { data: user, error } = await getTelegramSupabase()
        .from('telegram_users')
        .select('*')
        .eq('chat_id', ctx.chat!.id)
        .maybeSingle()

      if (error || !user) return ctx.reply('❌ Session expired. Use /link to start over.')
      if (new Date() > new Date(user.otp_expires_at)) return ctx.reply('❌ OTP expired. Use /link again.')
      if (user.otp_attempts >= 3) return ctx.reply('❌ Too many attempts. Use /link again.')

      if (text === user.otp_code) {
        await getTelegramSupabase()
          .from('telegram_users')
          .update({ is_verified: true, otp_code: null, linked_at: new Date().toISOString() })
          .eq('chat_id', ctx.chat!.id)

        ctx.linkedUser = { profile_id: user.profile_id, is_verified: true, chat_id: ctx.chat!.id }
        return ctx.reply('🎉 <b>Account linked!</b>\n\nUse /orders to view orders or /support for help.', { parse_mode: 'HTML' })
      }

      const attempts = user.otp_attempts + 1
      await getTelegramSupabase()
        .from('telegram_users')
        .update({ otp_attempts: attempts })
        .eq('chat_id', ctx.chat!.id)

      if (attempts >= 3) return ctx.reply('❌ Too many attempts. Use /link again.')
      return ctx.reply(`❌ Incorrect code. ${3 - attempts} attempt(s) left.`, {
        reply_markup: { force_reply: true, selective: true },
      })
    }

    await next()
  })
}
