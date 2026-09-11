'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  ExternalLink,
  User,
  Package,
  Calendar,
  DollarSign,
  Tag,
  Link as LinkIcon,
  Eye,
  X,
  Phone,
} from 'lucide-react'
import { formatPrice, formatDate, formatRelativeTime } from '@/lib/utils/formatters'

export interface RequestRow {
  id: string
  title: string
  description: string
  categoryName: string | null
  buyerId: string
  buyerName: string
  buyerPhone: string | null
  shopperId: string | null
  shopperName: string | null
  shopperPhone: string | null
  budget: number | null
  sourceUrl: string | null
  status: 'open' | 'assigned' | 'completed' | 'cancelled'
  created_at: string
}

interface RequestDataTableProps {
  rows: RequestRow[]
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    open:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    assigned:  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    completed: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    cancelled: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  }
  const style = map[status] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {status}
    </span>
  )
}

export function RequestDataTable({ rows }: RequestDataTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'assigned' | 'completed' | 'cancelled'>('all')
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null)

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.buyerName.toLowerCase().includes(q) ||
        (r.shopperName && r.shopperName.toLowerCase().includes(q)) ||
        (r.categoryName && r.categoryName.toLowerCase().includes(q))
      )
    })
  }, [rows, search, statusFilter])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, buyer, or seller…"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'open', 'assigned', 'completed', 'cancelled'] as const).map((s) => {
            const count = s === 'all' ? rows.length : rows.filter((r) => r.status === s).length
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {s} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-5 py-3">Request Details</th>
              <th className="px-5 py-3">Buyer</th>
              <th className="px-5 py-3">Assigned Seller</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Budget</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No buyer requests found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Title & Description */}
                  <td className="px-5 py-3.5 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-navy-900 text-sm truncate">{row.title}</p>
                      {row.sourceUrl && (
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Reference web link"
                          className="text-amber-600 hover:text-amber-700 shrink-0"
                        >
                          <LinkIcon size={12} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.description}</p>
                  </td>

                  {/* Buyer */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="font-semibold text-slate-800">{row.buyerName}</p>
                    {row.buyerPhone ? (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {row.buyerPhone}
                      </p>
                    ) : (
                      <span className="text-[11px] text-slate-300">No phone</span>
                    )}
                  </td>

                  {/* Assigned Shopper */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {row.shopperName ? (
                      <div>
                        <p className="font-semibold text-slate-800">{row.shopperName}</p>
                        {row.shopperPhone && (
                          <p className="text-[11px] text-slate-400">{row.shopperPhone}</p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-medium">
                      <Tag size={10} />
                      {row.categoryName || 'General'}
                    </span>
                  </td>

                  {/* Budget */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {row.budget ? (
                      <span className="font-bold text-navy-900">{formatPrice(row.budget)}</span>
                    ) : (
                      <span className="text-slate-400 italic">Flexible</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <StatusBadge status={row.status} />
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                    <div>{formatDate(row.created_at)}</div>
                    <div className="text-[10px] text-slate-400">{formatRelativeTime(row.created_at)}</div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(row)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-navy-900 transition-colors"
                        title="View Full Details"
                      >
                        <Eye size={13} />
                      </button>
                      <Link
                        href={`/requests/${row.id}`}
                        target="_blank"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                        title="Open on Marketplace"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
                  Request #{selectedRequest.id.slice(0, 8)}
                </span>
                <h3 className="text-lg font-bold text-navy-900 mt-0.5">{selectedRequest.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-navy-900 whitespace-pre-wrap leading-relaxed">
                  {selectedRequest.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Buyer
                  </label>
                  <p className="font-bold text-navy-900">{selectedRequest.buyerName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedRequest.buyerPhone || 'No phone recorded'}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Assigned Seller
                  </label>
                  <p className="font-bold text-navy-900">{selectedRequest.shopperName || 'Unassigned'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedRequest.shopperPhone || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <div className="mt-1"><StatusBadge status={selectedRequest.status} /></div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget</span>
                  <p className="font-bold text-navy-900 mt-1">
                    {selectedRequest.budget ? formatPrice(selectedRequest.budget) : 'Flexible'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</span>
                  <p className="font-semibold text-navy-900 mt-1">{selectedRequest.categoryName || 'General'}</p>
                </div>
              </div>

              {selectedRequest.sourceUrl && (
                <div className="pt-2">
                  <a
                    href={selectedRequest.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <LinkIcon size={12} />
                    External product reference: {selectedRequest.sourceUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <Link
                href={`/requests/${selectedRequest.id}`}
                target="_blank"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm inline-flex items-center gap-1.5 transition-colors"
              >
                Open on Marketplace
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
