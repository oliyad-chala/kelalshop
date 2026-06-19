'use server'

import { createClient } from '@/lib/supabase/server'
import { generateDeviceFingerprint } from '@/lib/utils/security'
import { queueEmail } from '@/lib/email/queue'
import { buildOtpEmail } from '@/lib/email/templates'
import { logUserAction } from '@/lib/actions/activity-log'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types/app.types'

/**
 * Resends the OTP verification code to the user's email,
 * enforcing a 60-second cooldown based on otp_sent_at.
 */
export async function sendDeviceOtp(): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Not authenticated.' }

  const { fingerprint } = await generateDeviceFingerprint()

  // 1. Fetch current device record
  const { data: device, error: deviceError } = await supabase
    .from('user_devices')
    .select('*')
    .eq('user_id', user.id)
    .eq('device_fingerprint', fingerprint)
    .single()

  if (deviceError || !device) {
    return { error: 'Device record not found. Please log in again.' }
  }

  // 2. Enforce 60-second resend cooldown
  if (device.otp_sent_at) {
    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(device.otp_sent_at).getTime()) / 1000
    )
    if (elapsedSeconds < 60) {
      return { error: `Please wait ${60 - elapsedSeconds} seconds before requesting a new code.` }
    }
  }

  // 3. Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

  const { error: updateError } = await supabase
    .from('user_devices')
    .update({
      otp_code: otp,
      otp_expires_at: otpExpiresAt,
      otp_attempts: 0,
      otp_sent_at: new Date().toISOString(),
    })
    .eq('id', device.id)

  if (updateError) {
    return { error: 'Failed to generate code. Please try again.' }
  }

  // 4. Send the OTP email
  const otpEmail = buildOtpEmail(otp, 'device-verification', 10)
  await queueEmail(
    'otp-device-verification',
    {
      to: user.email,
      subject: otpEmail.subject,
      html: otpEmail.html,
      text: otpEmail.text,
    },
    `otp-device-${user.id}-${Date.now()}`
  ).catch(console.error)

  return { success: 'Verification code resent successfully.' }
}

/**
 * Verifies the 6-digit OTP code. If correct, verifies the device
 * and unlocks the profile. Enforces maximum 5 attempts and expiry.
 */
export async function verifyDeviceOtp(otpCode: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Not authenticated.' }

  const { fingerprint, ip, userAgent } = await generateDeviceFingerprint()

  // 1. Fetch current device record
  const { data: device, error: deviceError } = await supabase
    .from('user_devices')
    .select('*')
    .eq('user_id', user.id)
    .eq('device_fingerprint', fingerprint)
    .single()

  if (deviceError || !device) {
    return { error: 'Device record not found. Please log in again.' }
  }

  // 2. Enforce maximum 5 attempts
  if (device.otp_attempts >= 5) {
    return { error: 'Maximum verification attempts exceeded. Access locked. Please contact support.' }
  }

  // 3. Check expiry
  if (!device.otp_expires_at || new Date() > new Date(device.otp_expires_at)) {
    return { error: 'Verification code has expired. Please request a new code.' }
  }

  // 4. Validate OTP
  if (device.otp_code !== otpCode.trim()) {
    const newAttempts = (device.otp_attempts || 0) + 1
    await supabase
      .from('user_devices')
      .update({ otp_attempts: newAttempts })
      .eq('id', device.id)

    if (newAttempts >= 5) {
      // Log event
      await logUserAction({
        userId: user.id,
        userName: user.email,
        actionType: 'security_lockout',
        description: `Too many device verification attempts. Device fingerprint: ${fingerprint}`,
      })
      return { error: 'Maximum attempts reached. Account locked for this device. Contact support.' }
    }

    return { error: `Incorrect code. ${5 - newAttempts} attempt(s) remaining.` }
  }

  // 5. Success! Mark device as verified
  const { error: verifyError } = await supabase
    .from('user_devices')
    .update({
      is_verified: true,
      otp_code: null,
      otp_expires_at: null,
      otp_attempts: 0,
    })
    .eq('id', device.id)

  if (verifyError) {
    return { error: 'Failed to verify device. Try again.' }
  }

  // 6. Check if user has ANY other unverified device currently holding up verification.
  // If not, clear requires_verification on profile.
  const { data: unverifiedDevices } = await supabase
    .from('user_devices')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_verified', false)

  if (!unverifiedDevices || unverifiedDevices.length === 0) {
    await supabase
      .from('profiles')
      .update({ requires_verification: false })
      .eq('id', user.id)
  }

  // 7. Log successful verification
  await logUserAction({
    userId: user.id,
    userName: user.email,
    actionType: 'device_verified',
    description: `Successfully verified new device: ${userAgent} (IP: ${ip})`,
  })

  revalidatePath('/dashboard')

  return { success: 'Device verified successfully.' }
}
