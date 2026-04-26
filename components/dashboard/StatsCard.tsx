import { Card } from '@/components/ui/Card'

interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  description?: string
}

export function StatsCard({ title, value, icon, description }: StatsCardProps) {
  return (
    <Card padding="md" className="flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-navy-900 tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
      </div>
    </Card>
  )
}
