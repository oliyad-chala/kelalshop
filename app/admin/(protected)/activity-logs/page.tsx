import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { getActivityLogs } from '@/lib/data/activity-logs'
import { ActivityLogsClient } from '@/components/admin/activity-logs/ActivityLogsClient'
import { ClipboardList } from 'lucide-react'

export const metadata = { title: 'Activity Logs' }

export default async function AdminActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; actionType?: string; entityType?: string; startDate?: string; endDate?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isAdminRole(profile?.role)) redirect('/admin/dashboard')

  const resolved = await searchParams
  const page = parseInt(resolved.page ?? '1', 10)

  const { logs, count } = await getActivityLogs({
    page,
    search:     resolved.search,
    actionType: resolved.actionType,
    entityType: resolved.entityType,
    startDate:  resolved.startDate,
    endDate:    resolved.endDate,
  })

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ClipboardList size={24} color="var(--color-accent-600)" />
            Activity Logs
          </h1>
          <p className="section-subtitle">
            A permanent, immutable record of every action performed by users.
          </p>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: '#f0fdf4', color: '#16a34a',
          border: '1px solid #bbf7d0', borderRadius: '20px',
          padding: '0.3rem 0.875rem', fontSize: '0.75rem', fontWeight: 600,
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          Read-only · {count.toLocaleString()} total records
        </div>
      </div>

      <ActivityLogsClient initialLogs={logs} initialCount={count} initialPage={page} />
    </div>
  )
}
