'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdminPortalRole, isAdminRole } from '@/lib/utils/admin-roles'
import type { UserRole } from '@/types/database.types'

type ProfileRow = { role: UserRole }

/** Session user with admin portal access (admin or staff). Returns service-role client. */
export async function requireStaffOrAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminPortalRole(profile?.role)) {
    throw new Error('Forbidden: admin portal access only')
  }

  return {
    user,
    profile: profile as ProfileRow,
    adminClient: createAdminClient(),
  }
}

/** Full superuser only. Returns service-role client. */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) {
    throw new Error('Forbidden: admin access only')
  }

  return {
    user,
    profile: profile as ProfileRow,
    adminClient: createAdminClient(),
  }
}

/** Read the current user's role for UI props (no throw on missing session). */
export async function getActorRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (profile?.role as UserRole) ?? null
}
