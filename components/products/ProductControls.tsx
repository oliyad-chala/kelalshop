'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select } from '@/components/ui/Select'

interface ProductControlsProps {
  currentSort?: string
  currentView?: string
}

export function ProductControls({ currentSort = 'newest', currentView = 'grid' }: ProductControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    return params.toString()
  }

  const handleSortChange = (sort: string) => {
    router.push(`${pathname}?${createQueryString('sort', sort)}`)
  }

  const handleViewChange = (view: 'grid' | 'list') => {
    router.push(`${pathname}?${createQueryString('view', view)}`)
  }

  return (
    <>
      <Select 
        value={currentSort}
        onChange={handleSortChange}
        options={[
          { value: 'newest', label: 'Newest' },
          { value: 'price_asc', label: 'Price: Low to High' },
          { value: 'price_desc', label: 'Price: High to Low' }
        ]}
        className="w-48 z-10"
      />

      <div className="flex items-center p-1 bg-slate-50 rounded-lg border border-slate-200">
        <button 
          onClick={() => handleViewChange('grid')}
          className={`p-1.5 rounded transition-colors ${currentView === 'grid' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-400 hover:text-navy-900'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button 
          onClick={() => handleViewChange('list')}
          className={`p-1.5 rounded transition-colors ${currentView === 'list' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-400 hover:text-navy-900'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>
    </>
  )
}
