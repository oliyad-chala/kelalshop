'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/actions/admin-access'

export type StaffMember = {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
}

export async function listStaff(): Promise<StaffMember[]> {
  const { adminClient } = await requireAdmin()

  const { data: staffProfiles, error } = await adminClient
    .from('profiles')
    .select('id, full_name, created_at')
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!staffProfiles?.length) return []

  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()
  if (authError) throw new Error(authError.message)

  const emailById = new Map(authData.users.map((u) => [u.id, u.email ?? null]))

  return staffProfiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailById.get(p.id) ?? null,
    created_at: p.created_at,
  }))
}

export async function promoteToStaff(email: string): Promise<{ error?: string; success?: string }> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { error: 'Email is required.' }

  const { adminClient } = await requireAdmin()

  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()
  if (authError) return { error: authError.message }

  const authUser = authData.users.find((u) => u.email?.toLowerCase() === normalized)
  if (!authUser) return { error: 'No user found with that email.' }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) return { error: 'User profile not found.' }
  if (profile.role === 'admin') return { error: 'This user is already an administrator.' }
  if (profile.role === 'staff') return { error: 'This user is already staff.' }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role: 'staff', updated_at: new Date().toISOString() } as any)
    .eq('id', authUser.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/staff')
  return { success: `${profile.full_name ?? normalized} has been promoted to staff.` }
}

export async function revokeStaff(userId: string): Promise<{ error?: string; success?: string }> {
  if (!userId) return { error: 'User ID is required.' }

  const { adminClient } = await requireAdmin()

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', userId)
    .single()

  if (profileError || !profile) return { error: 'User not found.' }
  if (profile.role !== 'staff') return { error: 'This user is not staff.' }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role: 'buyer', updated_at: new Date().toISOString() } as any)
    .eq('id', userId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/staff')
  return { success: `${profile.full_name ?? 'Staff member'} has been revoked.` }
}
