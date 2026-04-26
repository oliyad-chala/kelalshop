'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function adminSignIn(state: any, formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  // Role check — must be admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role !== 'admin') {
    // Sign out the non-admin user so we don't leave a stale session
    await supabase.auth.signOut()
    return { error: 'Access denied. This portal is restricted to admin users only.' }
  }

  redirect('/admin/dashboard')
}

export async function adminSignOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
