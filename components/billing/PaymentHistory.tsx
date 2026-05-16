import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatDate, formatPrice } from '@/lib/utils/formatters'

interface PaymentRequest {
  id: string
  amount: number
  payment_type: string
  reference_number: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface PaymentHistoryProps {
  payments: PaymentRequest[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'rejected':
      return <Badge variant="danger">Rejected</Badge>
    case 'pending':
    default:
      return <Badge variant="amber">Pending</Badge>
  }
}

function getPaymentTypeLabel(type: string) {
  switch (type) {
    case 'pro_subscription': return 'Pro Subscription'
    case 'boost_7_days': return 'Boost (7 Days)'
    case 'boost_28_days': return 'Boost (28 Days)'
    case 'banner_ad': return 'Banner Ad'
    default: return type.replace(/_/g, ' ')
  }
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (!payments || payments.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-slate-200">
        <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-slate-500 font-medium">No payment history found.</p>
        <p className="text-xs text-slate-400 mt-1">Your manual bank transfer requests will appear here.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-navy-900 px-1">Payment History</h2>
      
      {/* Desktop View (Table) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Reference No.</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                  {formatDate(payment.created_at)}
                </td>
                <td className="px-6 py-4 font-medium text-navy-900">
                  {getPaymentTypeLabel(payment.payment_type)}
                </td>
                <td className="px-6 py-4 font-bold text-amber-600">
                  {formatPrice(payment.amount)}
                </td>
                <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                  {payment.reference_number}
                </td>
                <td className="px-6 py-4 text-right">
                  {getStatusBadge(payment.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-bold text-navy-900 leading-tight mb-1">
                  {getPaymentTypeLabel(payment.payment_type)}
                </div>
                <div className="text-xs text-slate-500">
                  {formatDate(payment.created_at)}
                </div>
              </div>
              <div className="shrink-0">
                {getStatusBadge(payment.status)}
              </div>
            </div>
            
            <div className="flex justify-between items-end border-t border-slate-100 pt-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Ref No.</div>
                <div className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded">
                  {payment.reference_number}
                </div>
              </div>
              <div className="font-bold text-amber-600 text-lg">
                {formatPrice(payment.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
