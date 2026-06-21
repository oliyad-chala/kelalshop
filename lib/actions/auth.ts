'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDeviceFingerprint, checkRateLimit } from '@/lib/utils/security'
import { isDisposableEmail } from '@/lib/utils/email'
import { logUserAction } from '@/lib/actions/activity-log'
import type { ActionState } from '@/types/app.types'
import crypto from 'crypto'

import { queueEmail } from '@/lib/email/queue'
import { buildWelcomeEmail, buildPasswordChangedEmail, buildOtpEmail, buildForgotPasswordEmail } from '@/lib/email/templates'


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

  // ── Disposable Email Check ──────────────────────────────────────────
  if (isDisposableEmail(email)) {
    return { error: 'Disposable email addresses are not allowed.' }
  }

  // ── Rate Limiting ────────────────────────────────────────────────────
  const { ip } = await generateDeviceFingerprint()
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost'
  const isAllowed = isLocalhost ? true : await checkRateLimit(`signup:${ip}`, 5, 3600) // 5 signups per hour
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

  // Create user in unconfirmed state using the admin client (prevents auto-sending email links)
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { full_name: fullName, phone, role }
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user && email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins

    const { error: otpError } = await adminClient.from('email_verifications').upsert({
      email,
      otp_hash: otpHash,
      attempts: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    }, { onConflict: 'email' })

    if (otpError) {
      console.error('[Signup] Failed to store OTP:', otpError)
      return { error: 'Failed to initialize verification. Please try again.' }
    }

    const otpEmail = buildOtpEmail(otp, 'email-verification', 10)
    await queueEmail('email-verification-otp', {
      to: email,
      subject: otpEmail.subject,
      html: otpEmail.html,
      text: otpEmail.text
    }, `email-verification-${email}-${Date.now()}`).catch(err => {
      console.error('[Signup verification email] Failed to queue email:', err)
    })
  }

  return { success: 'confirm-otp', email }
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

  // ── Role guard — admins must use the admin portal ─────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin' || profile?.role === 'staff') {
    await supabase.auth.signOut()
    return {
      error: 'Admin and staff accounts cannot sign in here. Please use the Admin Portal.',
    }
  }

  // ── Login tracking & Device Fingerprinting ────────────────────────────
  // Log successful attempt
  await supabase.rpc('log_login_attempt', {
    p_email: email,
    p_ip_address: ip,
    p_device_fingerprint: fingerprint,
    p_is_success: true,
  })

  // Add to activity logs for all users
  await logUserAction({
    userId: data.user.id,
    userName: profile?.full_name ?? email,
    actionType: 'login',
    description: `User logged in via email (${profile?.role ?? 'buyer'})`
  })

  // Check if device is recognized
  const { data: deviceRecord } = await supabase
    .from('user_devices')
    .select('*')
    .eq('user_id', data.user.id)
    .eq('device_fingerprint', fingerprint)
    .single()

  if (!deviceRecord) {
    // New device detected! Log it without requiring OTP verification
    await supabase.from('user_devices').insert({
      user_id: data.user.id,
      device_fingerprint: fingerprint,
      ip_address: ip,
      user_agent: userAgent,
      is_verified: true,
      last_login_at: new Date().toISOString()
    })
  } else {
    // Update last login
    await supabase
      .from('user_devices')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', deviceRecord.id)
  }

  return { success: 'true' }
}

// ── Sign-out ──────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    await logUserAction({
      userId: user.id,
      userName: profile?.full_name ?? user.email ?? 'Unknown',
      actionType: 'logout',
      description: 'User logged out manually'
    })
  }
  await supabase.auth.signOut()
  redirect('/')
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Email is required.' }
  }

  // ── Rate Limiting ────────────────────────────────────────────────────
  const { ip } = await generateDeviceFingerprint()
  const isAllowed = await checkRateLimit(`reset:${ip}`, 100, 3600) // 100 resets per hour
  if (!isAllowed) {
    return { error: 'Too many reset requests. Please try again later.' }
  }

  // Check if user exists
  let user;
  try {
    const { data: userData, error: userError } = await adminClient.auth.admin.listUsers()
    if (!userError && userData?.users) {
      user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    }
  } catch (err) {
    console.error('[Reset Password] Network error fetching users:', err)
  }
  
  if (!user) {
    // Return success anyway to prevent email enumeration
    return { success: 'Check your inbox — we sent you a verification code.', email }
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins

  // Store in email_verifications
  const { error: otpError } = await adminClient.from('email_verifications').upsert({
    email,
    otp_hash: otpHash,
    attempts: 0,
    expires_at: expiresAt,
    created_at: new Date().toISOString()
  }, { onConflict: 'email' })

  if (otpError) {
    console.error('[Reset Password] Failed to store OTP:', otpError)
    return { error: 'Failed to generate reset code. Please try again later.' }
  }

  // Send email
  const emailData = buildForgotPasswordEmail(otp)
  await queueEmail('password-reset', {
    to: email,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text
  }, `password-reset-${email}-${Date.now()}`).catch(console.error)

  return { success: 'Check your inbox — we sent you a verification code.', email }
}

export async function verifyPasswordResetOtp(email: string, otpCode: string): Promise<ActionState> {
  const adminClient = createAdminClient()
  const { ip, userAgent } = await generateDeviceFingerprint()

  if (!email || !otpCode || otpCode.trim().length !== 6) {
    return { error: 'Invalid verification details.' }
  }

  // 1. Fetch OTP record
  const { data: record, error: fetchError } = await adminClient
    .from('email_verifications')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (fetchError || !record) {
    return { error: 'Verification code not found or expired. Please request a new one.' }
  }

  // 2. Check attempts
  if (record.attempts >= 5) {
    return { error: 'Maximum verification attempts exceeded. Please request a new code.' }
  }

  // 3. Check expiry
  if (new Date() > new Date(record.expires_at)) {
    return { error: 'Verification code has expired. Please request a new one.' }
  }

  // 4. Verify code (SHA-256 hashed comparison)
  const inputHash = crypto.createHash('sha256').update(otpCode.trim()).digest('hex')
  if (record.otp_hash !== inputHash) {
    const newAttempts = record.attempts + 1
    
    await adminClient
      .from('email_verifications')
      .update({ attempts: newAttempts })
      .eq('email', email)

    if (newAttempts >= 5) {
      return { error: 'Maximum attempts reached. Please request a new code.' }
    }

    return { error: `Incorrect code. ${5 - newAttempts} attempt(s) remaining.` }
  }

  // Success! Don't delete the record yet, we need it to verify the actual password change
  return { success: 'true' }
}

export async function confirmPasswordWithOtp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const adminClient = createAdminClient()
  
  const email = formData.get('email') as string
  const otpCode = formData.get('otp') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!email || !otpCode || !password || !confirmPassword) {
    return { error: 'All fields are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  // Verify the OTP one last time
  const { data: record, error: fetchError } = await adminClient
    .from('email_verifications')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (fetchError || !record) {
    return { error: 'Verification session expired. Please request a new code.' }
  }

  if (new Date() > new Date(record.expires_at)) {
    return { error: 'Verification code has expired. Please request a new one.' }
  }

  const inputHash = crypto.createHash('sha256').update(otpCode.trim()).digest('hex')
  if (record.otp_hash !== inputHash) {
    return { error: 'Invalid verification code.' }
  }

  // OTP is valid. Now find the user and update their password
  const { data: userData, error: userError } = await adminClient.auth.admin.listUsers()
  const user = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!user || userError) {
    return { error: 'User account not found.' }
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    password
  })

  if (updateError) {
    return { error: 'Failed to update password. Please try again.' }
  }

  // Delete the OTP record to prevent reuse
  await adminClient.from('email_verifications').delete().eq('email', email)

  // Notify user that password was changed
  await notifyPasswordChangedForUser(user.id, user.email, user.user_metadata?.full_name)

  return { success: 'Password successfully updated.' }
}

async function notifyPasswordChangedForUser(userId: string, email: string, fullName: string | undefined) {
  const name = fullName || email.split('@')[0] || 'User'
  const emailData = buildPasswordChangedEmail(name)

  await queueEmail('security-password-changed', {
    to: email,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text
  }, `password-changed-${userId}-${Date.now()}`)
}


export async function notifyPasswordChanged() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const fullName = profile?.full_name || user.email.split('@')[0] || 'User'
  const emailData = buildPasswordChangedEmail(fullName)

  await queueEmail('security-password-changed', {
    to: user.email,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text
  }, `password-changed-${user.id}-${Date.now()}`)

  return { success: true }
}
