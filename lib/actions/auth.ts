'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateDeviceFingerprint, checkRateLimit } from '@/lib/utils/security'
import type { ActionState } from '@/types/app.types'

// ── Google OAuth ─────────────────────────────────────────────────────────────

export async function signInWithGoogle(
  redirectTo?: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Safe path only — guard against open redirects
  const safePath =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/dashboard'

  const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(safePath)}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error || !data.url) {
    return { error: 'Failed to start Google sign-in. Please try again.' }
  }

  return { url: data.url }
}

// ── Email sign-up ─────────────────────────────────────────────────────────────

export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const email    = (formData.get('email')            as string)?.trim()
  const password = (formData.get('password')         as string) ?? ''
  const confirmPassword = (formData.get('confirm_password') as string) ?? ''
  const fullName = (formData.get('full_name')        as string)?.trim()
  const phone    = (formData.get('phone')            as string)?.trim()
  const role     = (formData.get('role')             as string)?.trim()

  // ── Field presence ──────────────────────────────────────────────────
  if (!email || !password || !fullName || !phone || !role) {
    return { error: 'All fields are required, including phone number.' }
  }

  // ── Name must not contain digits ────────────────────────────────────
  if (/\d/.test(fullName)) {
    return { error: 'Full name must not contain numbers.' }
  }

  // ── Rate Limiting ────────────────────────────────────────────────────
  const { ip } = await generateDeviceFingerprint()
  const isAllowed = await checkRateLimit(`signup:${ip}`, 5, 3600) // 5 signups per hour
  if (!isAllowed) {
    return { error: 'Too many registration attempts. Please try again later.' }
  }

  // ── Password rules ───────────────────────────────────────────────────
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }
  
  // Strength validation (must have at least 2 categories of complexity)
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score < 2) {
    return { error: 'Password is too weak. Please add uppercase letters, numbers, or symbols.' }
  }

  // ── Role guard ───────────────────────────────────────────────────────
  if (!['buyer', 'shopper'].includes(role)) {
    return { error: 'Invalid role selected.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, role },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If Supabase issued a session immediately (email confirm disabled),
  // redirect to dashboard. Otherwise show the "check your inbox" screen.
  if (data.session) {
    redirect('/dashboard')
  }

  return { success: 'confirm-email' }
}

// ── Email sign-in ─────────────────────────────────────────────────────────────

export async function signIn(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  // ── Rate Limiting ────────────────────────────────────────────────────
  const { fingerprint, ip, userAgent } = await generateDeviceFingerprint()
  
  // Limit by IP (10 per 15 minutes)
  const isIpAllowed = await checkRateLimit(`login_ip:${ip}`, 10, 900)
  if (!isIpAllowed) {
    return { error: 'Too many attempts from this network. Try again later.' }
  }

  // Limit by Email (5 per 15 minutes)
  const isEmailAllowed = await checkRateLimit(`login_email:${email}`, 5, 900)
  if (!isEmailAllowed) {
    return { error: 'Too many failed attempts for this account. Try again later.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Log failed attempt
    await supabase.rpc('log_login_attempt', {
      p_email: email,
      p_ip_address: ip,
      p_device_fingerprint: fingerprint,
      p_is_success: false,
    })
    return { error: 'Invalid email or password.' }
  }

  // ── Login tracking & Device Fingerprinting ────────────────────────────
  // Log successful attempt
  await supabase.rpc('log_login_attempt', {
    p_email: email,
    p_ip_address: ip,
    p_device_fingerprint: fingerprint,
    p_is_success: true,
  })

  // Check if device is recognized
  const { data: deviceRecord } = await supabase
    .from('user_devices')
    .select('*')
    .eq('user_id', data.user.id)
    .eq('device_fingerprint', fingerprint)
    .single()

  if (!deviceRecord) {
    // New device detected!
    await supabase.from('user_devices').insert({
      user_id: data.user.id,
      device_fingerprint: fingerprint,
      ip_address: ip,
      user_agent: userAgent,
      is_verified: false
    })

    // Lock profile for verification
    await supabase
      .from('profiles')
      .update({ requires_verification: true })
      .eq('id', data.user.id)
      
    // Redirect to verification screen
    redirect('/auth/verify-device')
  } else {
    // Update last login
    await supabase
      .from('user_devices')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', deviceRecord.id)
      
    // If device is not verified, redirect to verification screen
    if (!deviceRecord.is_verified) {
      redirect('/auth/verify-device')
    }
  }

  // ── Role guard — admins must use the admin portal ─────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin' || profile?.role === 'staff') {
    await supabase.auth.signOut()
    return {
      error: 'Admin and staff accounts cannot sign in here. Please use the Admin Portal.',
    }
  }

  return { success: 'true' }
}

// ── Sign-out ──────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Email is required.' }
  }

  // ── Rate Limiting ────────────────────────────────────────────────────
  const { ip } = await generateDeviceFingerprint()
  const isAllowed = await checkRateLimit(`reset:${ip}`, 3, 3600) // 3 resets per hour
  if (!isAllowed) {
    return { error: 'Too many reset requests. Please try again later.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your inbox — we sent you a reset link.' }
}
