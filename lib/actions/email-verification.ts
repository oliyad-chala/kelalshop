'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { generateDeviceFingerprint } from '@/lib/utils/security'
import { queueEmail } from '@/lib/email/queue'
import { buildOtpEmail, buildWelcomeEmail } from '@/lib/email/templates'
import type { ActionState } from '@/types/app.types'
import crypto from 'crypto'

/**
 * Verifies the 6-digit email OTP.
 * On success, confirms the user in Supabase auth and deletes the OTP.
 */
export async function verifyEmailOtp(email: string, otpCode: string): Promise<ActionState> {
  const adminClient = createAdminClient()
  const { fingerprint, ip, userAgent } = await generateDeviceFingerprint()

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
    return { error: 'Verification code not found or expired. Please sign up again.' }
  }

  // 2. Check attempts
  if (record.attempts >= 5) {
    // Log final failed attempt
    await adminClient.from('email_verification_logs').insert({
      email,
      ip_address: ip,
      user_agent: userAgent,
      is_success: false,
      error_message: 'Max attempts exceeded lockout'
    })
    return { error: 'Maximum verification attempts exceeded. Please register again.' }
  }

  // 3. Check expiry
  if (new Date() > new Date(record.expires_at)) {
    // Log failure
    await adminClient.from('email_verification_logs').insert({
      email,
      ip_address: ip,
      user_agent: userAgent,
      is_success: false,
      error_message: 'OTP expired'
    })
    return { error: 'Verification code has expired. Please request a new code.' }
  }

  // 4. Verify code (SHA-256 hashed comparison)
  const inputHash = crypto.createHash('sha256').update(otpCode.trim()).digest('hex')
  if (record.otp_hash !== inputHash) {
    const newAttempts = record.attempts + 1
    
    // Update attempts
    await adminClient
      .from('email_verifications')
      .update({ attempts: newAttempts })
      .eq('email', email)

    // Log failed attempt
    await adminClient.from('email_verification_logs').insert({
      email,
      ip_address: ip,
      user_agent: userAgent,
      is_success: false,
      error_message: `Incorrect code: attempt ${newAttempts}`
    })

    if (newAttempts >= 5) {
      return { error: 'Maximum attempts reached. Registration locked. Please register again.' }
    }

    return { error: `Incorrect code. ${5 - newAttempts} attempt(s) remaining.` }
  }

  // 5. Success! Get user by email to confirm their account
  const { data: userData, error: userError } = await adminClient.auth.admin.listUsers()
  if (userError || !userData?.users) {
    return { error: 'Failed to retrieve user accounts.' }
  }

  const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    return { error: 'User account not found.' }
  }

  const { error: confirmError } = await adminClient.auth.admin.updateUserById(user.id, {
    email_confirm: true
  })

  if (confirmError) {
    return { error: 'Failed to activate account. Please contact support.' }
  }

  // 6. Delete OTP record and log success
  await adminClient.from('email_verifications').delete().eq('email', email)
  
  await adminClient.from('email_verification_logs').insert({
    email,
    ip_address: ip,
    user_agent: userAgent,
    is_success: true
  })

  // 7. Queue welcome email for verified user
  const fullName = user.user_metadata?.full_name || email.split('@')[0]
  const welcome = buildWelcomeEmail(fullName)
  await queueEmail('welcome', {
    to: email,
    subject: welcome.subject,
    html: welcome.html,
    text: welcome.text
  }, `welcome-${user.id}`).catch(err => {
    console.error('[Signup welcome email] Failed to queue email:', err)
  })

  return { success: 'true' }
}

/**
 * Resends the verification OTP after enforcing a 60-second cooldown.
 */
export async function resendEmailOtp(email: string): Promise<ActionState> {
  const adminClient = createAdminClient()

  if (!email) {
    return { error: 'Email address is required.' }
  }

  // 1. Fetch current OTP record to check cooldown
  const { data: record, error: fetchError } = await adminClient
    .from('email_verifications')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (fetchError || !record) {
    return { error: 'Verification session not found. Please register again.' }
  }

  // 2. Enforce 60-second cooldown
  const elapsed = (Date.now() - new Date(record.created_at).getTime()) / 1000
  if (elapsed < 60) {
    return { error: `Please wait ${Math.ceil(60 - elapsed)} seconds before requesting a new code.` }
  }

  // 3. Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins

  // 4. Update the OTP details in DB
  const { error: updateError } = await adminClient
    .from('email_verifications')
    .update({
      otp_hash: otpHash,
      attempts: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    })
    .eq('email', email)

  if (updateError) {
    return { error: 'Failed to generate code. Please try again.' }
  }

  // 5. Send OTP Email via Resend
  const otpEmail = buildOtpEmail(otp, 'email-verification', 10)
  await queueEmail(
    'email-verification-otp',
    {
      to: email,
      subject: otpEmail.subject,
      html: otpEmail.html,
      text: otpEmail.text
    },
    `email-verification-${email}-${Date.now()}`
  ).catch(console.error)

  return { success: 'Verification code resent successfully.' }
}
