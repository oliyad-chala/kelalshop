import { createAdminClient } from '@/lib/supabase/admin'
import type { ActivityLog } from './activity-logs'

export interface ActivityLogStats {
  todayCount: number
  weekCount: number
  mostActiveAdmin: { name: string; count: number } | null
  recentLogs: ActivityLog[]
}

export async function getActivityLogStats(): Promise<ActivityLogStats> {
  const admin = createAdminClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const [todayRes, weekRes, recentRes] = await Promise.all([
    admin
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
    admin
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString()),
    admin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Find the most active admin this week
  const { data: weekLogs } = await admin
    .from('activity_logs')
    .select('admin_name')
    .gte('created_at', weekStart.toISOString())

  let mostActiveAdmin: { name: string; count: number } | null = null
  if (weekLogs && weekLogs.length > 0) {
    const counts: Record<string, number> = {}
    for (const log of weekLogs as any[]) {
      counts[log.admin_name] = (counts[log.admin_name] ?? 0) + 1
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (top) mostActiveAdmin = { name: top[0], count: top[1] }
  }

  return {
    todayCount: todayRes.count ?? 0,
    weekCount: weekRes.count ?? 0,
    mostActiveAdmin,
    recentLogs: (recentRes.data ?? []) as ActivityLog[],
  }
}
