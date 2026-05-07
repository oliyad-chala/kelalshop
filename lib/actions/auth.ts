'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/types/app.types'

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

  // ── Password rules ───────────────────────────────────────────────────
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  // ── Role guard ───────────────────────────────────────────────────────
  if (!['buyer', 'shopper'].includes(role)) {
    return { error: 'Invalid role selected.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, role },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  // ── Role guard — admins must use the admin portal ───────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    // Sign out immediately — admin should not be in the shopper session
    await supabase.auth.signOut()
    return {
      error: 'Admin accounts cannot sign in here. Please use the Admin Portal.',
    }
  }
  // ────────────────────────────────────────────────────────────────────

  return { success: 'true' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Email is required.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your inbox — we sent you a reset link.' }
}
