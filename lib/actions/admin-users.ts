'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, requireStaffOrAdmin } from '@/lib/actions/admin-access'

export async function getUsers(page = 1, roleFilter?: string, searchQuery?: string) {
  const { adminClient: admin } = await requireStaffOrAdmin()
  const perPage = 20
  const offset = (page - 1) * perPage

  let query = admin.from('profiles').select('*', { count: 'exact' })

  if (roleFilter && roleFilter !== 'all') {
    query = query.eq('role', roleFilter)
  }

  if (searchQuery) {
    query = query.ilike('full_name', `%${searchQuery}%`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], count: 0 }
  }

  return { users: data || [], count: count || 0 }
}

export async function toggleUserSuspend(userId: string, isSuspended: boolean) {
  const { adminClient: admin } = await requireAdmin()

  const { error } = await admin
    .from('profiles')
    .update({ 
      is_suspended: isSuspended,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/users')
}
