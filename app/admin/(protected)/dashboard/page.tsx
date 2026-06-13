import {
  DollarSign,
  Users,
  ShieldCheck,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { OrderVolumeChart, CategoryChart, TopSellersChart, VisitorChart } from '@/components/admin/AdminCharts'
import { getAdminStats, getOrderVolumeChart, getCategoryChart, getTopSellersChart, getVisitorChart } from '@/lib/actions/admin'

export const metadata = { title: 'Dashboard' }

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `ETB ${(n / 1_000).toFixed(1)}k`
  return `ETB ${n.toFixed(0)}`
}

// ── Inline professional stat card (no separate component needed) ──
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  change,
  changeLabel,
  href,
}: {
  label: string
  value: string
  icon: React.ElementType
  color: string
  bg: string
  change?: string
  changeLabel?: string
  href?: string
}) {
  const inner = (
    <div className={href ? 'kpi-card kpi-card-link' : 'kpi-card'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} color={color} />
        </div>
        {href && <ArrowUpRight size={16} color="#8c98b5" />}
      </div>
      <div>
        <p style={{ fontSize: '0.78rem', color: '#8c98b5', fontWeight: 500, margin: '0 0 4px 0' }}>{label}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2d3d', margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {value}
        </p>
        {change && (
          <p style={{ fontSize: '0.72rem', color: '#10b981', margin: '6px 0 0 0', fontWeight: 600 }}>
            {change} <span style={{ color: '#8c98b5', fontWeight: 400 }}>{changeLabel}</span>
          </p>
        )}
      </div>
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link> : inner
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = isAdminRole(profile?.role)

  const [stats, volumeData, categoryData, topSellersData, visitorData] = await Promise.all([
    getAdminStats(),
    getOrderVolumeChart(),
    getCategoryChart(),
    getTopSellersChart(),
    getVisitorChart()
  ])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  const quickLinks = [
    {
      href: '/admin/verifications',
      label: 'Pending Verifications',
      description: 'Review seller identity documents',
      count: stats.pendingVerifications,
      icon: ShieldCheck,
      color: '#f59e0b',
      bg: '#fff7ed',
    },
    {
      href: '/admin/payouts',
      label: 'Payment Requests',
      description: 'Approve or reject payment receipts',
      count: stats.pendingPayments,
      icon: DollarSign,
      color: '#5f63f2',
      bg: '#f0f1ff',
    },
    ...(isAdmin ? [{
      href: '/admin/disputes',
      label: 'Open Disputes',
      description: 'Resolve buyer-seller conflicts',
      count: null,
      icon: AlertCircle,
      color: '#ef4444',
      bg: '#fff1f2',
    }] : []),
  ]

  return (
    <div className="fade-in">

      {/* ── Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2d3d', margin: 0, letterSpacing: '-0.02em' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#8c98b5', margin: '4px 0 0 0' }}>{today}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: '#f0fdf4', color: '#16a34a',
              border: '1px solid #bbf7d0', borderRadius: '20px',
              padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}>
        <KpiCard
          label="Total Revenue"
          value={fmtCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="#10b981"
          bg="#f0fdf4"
          change="↑ 12.5%"
          changeLabel="vs last month"
        />
        <KpiCard
          label="Active Requests"
          value={stats.activeRequests.toLocaleString()}
          icon={Activity}
          color="#5f63f2"
          bg="#f0f1ff"
          change="↑ 4"
          changeLabel="today"
        />
        <KpiCard
          label="New Sellers (30d)"
          value={stats.newShoppers.toLocaleString()}
          icon={TrendingUp}
          color="#f59e0b"
          bg="#fffbeb"
          change="↑ 8.1%"
          changeLabel="growth"
        />
        <KpiCard
          label="Pending Verifications"
          value={stats.pendingVerifications.toLocaleString()}
          icon={ShieldCheck}
          color="#ef4444"
          bg="#fff1f2"
          href="/admin/verifications"
        />
        <KpiCard
          label="Total Sellers"
          value={stats.totalShoppers.toLocaleString()}
          icon={Users}
          color="#06b6d4"
          bg="#ecfeff"
        />
        <KpiCard
          label="Total Buyers"
          value={stats.totalBuyers.toLocaleString()}
          icon={Users}
          color="#8b5cf6"
          bg="#f3e8ff"
        />
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '1rem',
        marginBottom: '1rem',
      }}>
        <OrderVolumeChart data={volumeData} />
        <CategoryChart data={categoryData} />
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}>
        <TopSellersChart data={topSellersData} />
        <VisitorChart data={visitorData} />
      </div>

      {/* ── Quick Actions ── */}
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        border: '1px solid #f0f1f5',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #f0f1f5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1f2d3d', margin: 0 }}>Quick Actions</p>
          <span style={{ fontSize: '0.75rem', color: '#8c98b5' }}>Items requiring attention</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 0 }}>
          {quickLinks.map(({ href, label, description, count, icon: Icon, color, bg }, i) => (
            <Link
              key={href}
              href={href}
              className="quick-action-link"
              style={{
                borderRight: i < quickLinks.length - 1 ? '1px solid #f0f1f5' : 'none',
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2d3d', margin: 0 }}>{label}</p>
                  {count !== null && count > 0 && (
                    <span style={{
                      background: color, color: '#fff',
                      borderRadius: '20px', padding: '1px 8px',
                      fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      {count}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#8c98b5', margin: '2px 0 0 0' }}>{description}</p>
              </div>
              <ArrowRight size={16} color="#c8d0e0" />
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
