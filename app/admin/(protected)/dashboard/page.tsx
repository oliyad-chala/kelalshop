import {
  DollarSign,
  Users,
  ShieldCheck,
  Activity,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/admin/StatCard'
import { OrderVolumeChart, CategoryChart } from '@/components/admin/AdminCharts'
import { getAdminStats, getOrderVolumeChart, getCategoryChart } from '@/lib/actions/admin'

export const metadata = { title: 'Dashboard' }

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `ETB ${(n / 1_000).toFixed(1)}k`
  return `ETB ${n.toFixed(0)}`
}

export default async function AdminDashboardPage() {
  const [stats, volumeData, categoryData] = await Promise.all([
    getAdminStats(),
    getOrderVolumeChart(),
    getCategoryChart(),
  ])

  const quickLinks = [
    { href: '/admin/verifications', label: 'Review pending IDs', count: stats.pendingVerifications, color: '#f59e0b' },
    { href: '/admin/payouts',       label: 'Release payouts',    count: null,                       color: '#6366f1' },
    { href: '/admin/disputes',      label: 'Resolve disputes',   count: null,                       color: '#ef4444' },
  ]

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-subtitle">Platform overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="admin-badge badge-open">
            <span className="pulse-soft" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
            Live
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard
          label="Total Revenue"
          value={fmtCurrency(stats.totalRevenue)}
          icon={DollarSign}
          iconColor="#10b981"
          iconBg="rgba(16,185,129,0.12)"
        />
        <StatCard
          label="Active Requests"
          value={stats.activeRequests.toLocaleString()}
          icon={Activity}
          iconColor="#6366f1"
          iconBg="rgba(99,102,241,0.12)"
        />
        <StatCard
          label="New Shoppers (30d)"
          value={stats.newShoppers.toLocaleString()}
          icon={TrendingUp}
          iconColor="#f59e0b"
          iconBg="rgba(245,158,11,0.12)"
        />
        <StatCard
          label="Pending Verifications"
          value={stats.pendingVerifications.toLocaleString()}
          icon={ShieldCheck}
          iconColor="#ef4444"
          iconBg="rgba(239,68,68,0.12)"
        />
        <StatCard
          label="Total Shoppers"
          value={stats.totalShoppers.toLocaleString()}
          icon={Users}
          iconColor="#38bdf8"
          iconBg="rgba(56,189,248,0.12)"
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
        <OrderVolumeChart data={volumeData} />
        <CategoryChart data={categoryData} />
      </div>

      {/* Quick actions */}
      <div className="admin-card">
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Quick Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {quickLinks.map(({ href, label, count, color }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.65rem 0.875rem',
                borderRadius: '7px',
                background: 'var(--color-admin-elevated)',
                border: '1px solid var(--color-admin-border)',
                textDecoration: 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{label}</span>
                {count !== null && count > 0 && (
                  <span className="admin-badge badge-pending" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                    {count}
                  </span>
                )}
              </div>
              <ArrowRight size={13} style={{ color: 'var(--color-text-muted)' }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
