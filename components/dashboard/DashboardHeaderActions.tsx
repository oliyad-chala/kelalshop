'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, DollarSign, CreditCard, Megaphone } from 'lucide-react'
import { RecordSaleModal } from '@/components/orders/RecordSaleModal'

interface DashboardHeaderActionsProps {
  products: {
    id: string
    name: string
    price: number
    is_available: boolean
    image?: string | null
  }[]
  shopperId: string
  shopperName: string
}

export function DashboardHeaderActions({
  products,
  shopperId,
  shopperName,
}: DashboardHeaderActionsProps) {
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Create Product */}
        <Link href="/dashboard/listings/new">
          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold px-5 py-2.5 text-sm shadow-md shadow-amber-500/20 transition-all duration-150">
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Product</span>
          </button>
        </Link>

        {/* Record Sale - Opens Modal Directly */}
        <button
          type="button"
          onClick={() => setIsRecordSaleOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-5 py-2.5 text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all duration-150"
        >
          <DollarSign className="w-4 h-4 stroke-[2.5]" />
          <span>Record Sale</span>
        </button>

        {/* Billing */}
        <Link href="/dashboard/billing">
          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold px-5 py-2.5 text-sm border border-slate-200 shadow-sm hover:border-slate-300 transition-all duration-150">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span>Billing</span>
          </button>
        </Link>

        {/* Campaigns */}
        <Link href="/dashboard/campaigns">
          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold px-5 py-2.5 text-sm border border-slate-200 shadow-sm hover:border-slate-300 transition-all duration-150">
            <Megaphone className="w-4 h-4 text-slate-500" />
            <span>Campaigns</span>
          </button>
        </Link>
      </div>

      <RecordSaleModal
        isOpen={isRecordSaleOpen}
        onClose={() => setIsRecordSaleOpen(false)}
        products={products}
        shopperId={shopperId}
        shopperName={shopperName}
        onSuccess={() => {
          if (typeof window !== 'undefined') window.location.reload()
        }}
      />
    </>
  )
}
