'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

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
  action: string,
  email: string,
  ip: string
) {
  // Silently insert — don't block auth flow if this fails
  await supabase.from('admin_audit_log').insert({
    admin_email: email,
    action,
    ip_address: ip,
  }).then(() => {})
}

export async function adminSignIn(state: AdminAuthState, formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const ip = await getClientIp()

  // ── Rate limiting ───────────────────────────────────────────────────
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count: recentAttempts } = await supabase
    .from('admin_audit_log')
    .select('*', { count: 'exact', head: true })
    .eq('action', 'login_failed')
    .eq('ip_address', ip)
    .gte('created_at', windowStart)

  if ((recentAttempts ?? 0) >= MAX_ATTEMPTS) {
    return {
      error: `Too many failed attempts. Please wait ${WINDOW_MINUTES} minutes before trying again.`,
    }
  }
  // ────────────────────────────────────────────────────────────────────

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    await writeAuditLog(supabase, 'login_failed', email, ip)
    return { error: 'Invalid email or password.' }
  }

  // Role check — must be admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role !== 'admin') {
    await supabase.auth.signOut()
    await writeAuditLog(supabase, 'login_denied_not_admin', email, ip)
    return { error: 'Access denied. This portal is restricted to admin users only.' }
  }

  await writeAuditLog(supabase, 'login_success', email, ip)
  redirect('/admin/dashboard')
}

export async function adminSignOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

