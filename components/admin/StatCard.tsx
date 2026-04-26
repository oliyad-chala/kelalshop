import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  iconBg: string
  trend?: { value: number; label: string }
}

export function StatCard({ label, value, icon: Icon, iconColor, iconBg, trend }: StatCardProps) {
  const isPositive = (trend?.value ?? 0) >= 0

  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {value}
        </div>
        {trend && (
          <div style={{
            fontSize: '0.72rem',
            color: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
            marginTop: '0.3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
          }}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  )
}
