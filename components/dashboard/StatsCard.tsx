import { Card } from '@/components/ui/Card'
import { clsx } from 'clsx'

interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  trend?: {
    value: number
    label: string
  }
}

export function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <Card padding="md" className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
      
      <div className="mt-auto">
        <div className="text-3xl font-bold text-navy-900">{value}</div>
        {trend && (
          <div className="mt-2 flex items-center text-sm">
            <span
              className={clsx(
                'font-medium inline-flex items-center gap-1',
                trend.value >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              <svg 
                className={clsx("w-3 h-3", trend.value < 0 && "rotate-180")} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-slate-500 ml-2">{trend.label}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
