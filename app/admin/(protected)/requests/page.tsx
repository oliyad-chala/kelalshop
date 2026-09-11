import { requireStaffOrAdmin } from '@/lib/actions/admin-access'
import { RequestDataTable, RequestRow } from '@/components/admin/requests/RequestDataTable'
import { SearchCheck, CheckCircle2, Clock, Users } from 'lucide-react'

export const metadata = {
  title: 'Buyer Requests | Admin Portal',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminRequestsPage() {
  const { adminClient } = await requireStaffOrAdmin()

  const { data } = await adminClient
    .from('requests')
    .select(`
      id,
      title,
      description,
      status,
      budget,
      source_url,
      created_at,
      categories(name),
      buyer:profiles!requests_buyer_id_fkey(id, full_name, phone),
      shopper:profiles!requests_shopper_id_fkey(id, full_name, phone)
    `)
    .order('created_at', { ascending: false })

  const rows: RequestRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description || '',
    categoryName: r.categories?.name ?? 'General',
    buyerId: r.buyer?.id ?? '',
    buyerName: r.buyer?.full_name ?? 'Anonymous Buyer',
    buyerPhone: r.buyer?.phone ?? null,
    shopperId: r.shopper?.id ?? null,
    shopperName: r.shopper?.full_name ?? null,
    shopperPhone: r.shopper?.phone ?? null,
    budget: r.budget ? Number(r.budget) : null,
    sourceUrl: r.source_url ?? null,
    status: r.status,
    created_at: r.created_at,
  }))

  const total = rows.length
  const openCount = rows.filter((r) => r.status === 'open').length
  const assignedCount = rows.filter((r) => r.status === 'assigned').length
  const completedCount = rows.filter((r) => r.status === 'completed').length

  return (
    <div className="space-y-6 fade-in">
      
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
          <SearchCheck className="text-amber-500 w-7 h-7" />
          Buyer Sourcing Requests
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review, oversee, and track items that buyers have asked sellers and shoppers to source.
        </p>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <SearchCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Requests</p>
            <p className="text-xl font-bold text-navy-900 leading-tight mt-0.5">{total}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Open Requests</p>
            <p className="text-xl font-bold text-navy-900 leading-tight mt-0.5">{openCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Assigned to Sellers</p>
            <p className="text-xl font-bold text-navy-900 leading-tight mt-0.5">{assignedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Completed</p>
            <p className="text-xl font-bold text-navy-900 leading-tight mt-0.5">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* ── Interactive Data Table ── */}
      <RequestDataTable rows={rows} />

    </div>
  )
}
