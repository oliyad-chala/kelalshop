import { createAdminClient } from '@/lib/supabase/admin'

export interface ActivityLog {
  id: string
  admin_id: string | null
  admin_name: string
  action_type: string
  entity_type: string | null
  entity_id: string | null
  description: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface GetActivityLogsParams {
  page?: number
  search?: string
  actionType?: string
  entityType?: string
  startDate?: string
  endDate?: string
}

const PER_PAGE = 20

export async function getActivityLogs(params: GetActivityLogsParams = {}) {
  const admin = createAdminClient()
  const { page = 1, search, actionType, entityType, startDate, endDate } = params
  const offset = (page - 1) * PER_PAGE

  let query = admin
    .from('activity_logs')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.or(`admin_name.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (actionType && actionType !== 'all') {
    query = query.eq('action_type', actionType)
  }
  if (entityType && entityType !== 'all') {
    query = query.eq('entity_type', entityType)
  }
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    // include the full end day
    const endOfDay = new Date(endDate)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte('created_at', endOfDay.toISOString())
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + PER_PAGE - 1)

  if (error) {
    console.error('[ActivityLogs] fetch error:', error)
    return { logs: [] as ActivityLog[], count: 0 }
  }

  return { logs: (data ?? []) as ActivityLog[], count: count ?? 0 }
}

export async function exportActivityLogs(params: Omit<GetActivityLogsParams, 'page'> = {}) {
  const admin = createAdminClient()
  const { search, actionType, entityType, startDate, endDate } = params

  let query = admin.from('activity_logs').select('*')

  if (search) {
    query = query.or(`admin_name.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (actionType && actionType !== 'all') {
    query = query.eq('action_type', actionType)
  }
  if (entityType && entityType !== 'all') {
    query = query.eq('entity_type', entityType)
  }
  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) {
    const endOfDay = new Date(endDate)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte('created_at', endOfDay.toISOString())
  }

  const { data } = await query.order('created_at', { ascending: false }).limit(5000)
  return (data ?? []) as ActivityLog[]
}
