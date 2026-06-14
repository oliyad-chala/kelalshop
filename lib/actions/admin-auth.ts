'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { isAdminPortalRole } from '@/lib/utils/admin-roles'
import { logAdminAction } from './activity-log'
import { emitTelegramEvent } from '@/lib/telegram/notifications/templates'

type AdminAuthState = { error?: string } | null

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'
  )
}

async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: 'login_failed' | 'login_denied_not_admin' | 'login_success',
  email: string,
  ip: string
) {
  await supabase.rpc('log_admin_audit', {
    p_action: action,
    p_email: email,
    p_ip: ip,
  }).then(() => {})
}

async function isAdminLoginBlocked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  ip: string
): Promise<boolean> {
  // Local dev: don't lock yourself out while testing (production still rate-limits)
  if (process.env.NODE_ENV === 'development') {
    return false
  }

  const normalizedEmail = email.toLowerCase()

  const [{ data: ipFailures }, { data: emailFailures }] = await Promise.all([
    supabase.rpc('count_admin_login_failures', {
      p_ip: ip,
      p_window_minutes: WINDOW_MINUTES,
    }),
    supabase.rpc('count_admin_login_failures_by_email', {
      p_email: normalizedEmail,
      p_window_minutes: WINDOW_MINUTES,
    }),
  ])

  return (ipFailures ?? 0) >= MAX_ATTEMPTS || (emailFailures ?? 0) >= MAX_ATTEMPTS
}

export async function adminSignIn(state: AdminAuthState, formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const ip = await getClientIp()

  if (await isAdminLoginBlocked(supabase, email, ip)) {
    emitTelegramEvent('admin', 'SUSPICIOUS_ACTIVITY', {
      userId: email,
      description: `Blocked admin login — too many failures from IP ${ip}`,
    }, { idempotencyKey: `login-blocked-${email}-${ip}` })
    return {
      error: `Too many failed attempts. Please wait ${WINDOW_MINUTES} minutes before trying again.`,
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    await writeAuditLog(supabase, 'login_failed', email, ip)
    return { error: 'Invalid email or password.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (!isAdminPortalRole(profile?.role)) {
    await supabase.auth.signOut()
    await writeAuditLog(supabase, 'login_denied_not_admin', email, ip)
    return { error: 'Access denied. This portal is restricted to admin and staff users only.' }
  }

  await writeAuditLog(supabase, 'login_success', email, ip)
  
  await logAdminAction({
    adminId: data.user.id,
    adminName: profile?.full_name || 'Admin',
    actionType: 'login',
    description: `Logged into the admin portal`,
  })

  redirect('/admin/dashboard')
}

export async function adminSignOut() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    await logAdminAction({
      adminId: user.id,
      adminName: profile?.full_name || 'Admin',
      actionType: 'logout',
      description: `Logged out of the admin portal`,
    })
  }

  await supabase.auth.signOut()
  redirect('/admin/login')
}
