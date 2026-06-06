import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { getActivityLogs, exportActivityLogs } from '@/lib/data/activity-logs'

export async function GET(req: NextRequest) {
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isAdminRole(profile?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const isExport = searchParams.get('export') === '1'
  const params = {
    search:     searchParams.get('search')     ?? undefined,
    actionType: searchParams.get('actionType') ?? undefined,
    entityType: searchParams.get('entityType') ?? undefined,
    startDate:  searchParams.get('startDate')  ?? undefined,
    endDate:    searchParams.get('endDate')    ?? undefined,
  }

  if (isExport) {
    const data = await exportActivityLogs(params)
    return NextResponse.json(data)
  }

  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const result = await getActivityLogs({ ...params, page })
  return NextResponse.json(result)
}
