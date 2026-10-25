'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, ShoppingBag, PhoneCall } from 'lucide-react'
import { RecordSaleModal } from './RecordSaleModal'
import { ContactedItemsList } from './ContactedItemsList'
import { getContactedProducts } from '@/lib/utils/contacted-items'

interface OrdersHeaderAndTabsProps {
  isShopper: boolean
  ordersCount: number
  sellerProducts: { id: string; name: string; price: number; is_available: boolean }[]
  children: React.ReactNode
}

export function OrdersHeaderAndTabs({
  isShopper,
  ordersCount,
  sellerProducts,
  children,
}: OrdersHeaderAndTabsProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'contacted'>('orders')
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false)
  const [contactedCount, setContactedCount] = useState(0)

  useEffect(() => {
    if (!isShopper) {
      setContactedCount(getContactedProducts().length)
    }
  }, [isShopper])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
            {isShopper ? 'Manage Orders & Sales' : 'My Orders & Inquiries'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isShopper
              ? 'Track orders from custom requests and record direct offline sales.'
              : 'Track request fulfillments and products you contacted sellers about.'}
          </p>
        </div>

        {/* Seller '+ Record Direct Sale' Button */}
        {isShopper && (
          <button
            type="button"
            onClick={() => setIsRecordSaleOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Record Direct Sale</span>
          </button>
        )}
      </div>

      {/* Buyer Tabs (Orders vs Contacted Items) */}
      {!isShopper && (
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-navy-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Orders</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {ordersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contacted')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'contacted'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-navy-900'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contacted Items</span>
            {contactedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                {contactedCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content Area */}
      {!isShopper && activeTab === 'contacted' ? (
        <ContactedItemsList />
      ) : (
        children
      )}

      {/* Record Sale Modal for Sellers */}
      {isShopper && (
        <RecordSaleModal
          isOpen={isRecordSaleOpen}
          onClose={() => setIsRecordSaleOpen(false)}
          products={sellerProducts}
        />
      )}
    </div>
  )
}
