'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

interface OrderVolumePoint {
  date: string
  revenue: number
  orders: number
}

interface CategoryPoint {
  name: string
  count: number
}

const ACCENT = '#6366f1'
const SURFACE = '#161d2e'
const BORDER = '#1e2a3d'
const TEXT_MUTED = '#64748b'
const TEXT_SEC = '#94a3b8'

const BAR_COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#818cf8','#7c3aed','#5b21b6','#4c1d95']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCurrency(v: number) {
  return v >= 1000 ? `ETB ${(v / 1000).toFixed(1)}k` : `ETB ${v.toFixed(0)}`
}

const tooltipStyle = {
  backgroundColor: '#0f1623',
  border: `1px solid ${BORDER}`,
  borderRadius: '7px',
  color: '#f1f5f9',
  fontSize: '0.78rem',
}

export function OrderVolumeChart({ data }: { data: OrderVolumePoint[] }) {
  return (
    <div className="admin-card" style={{ height: '260px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: TEXT_SEC, marginBottom: '1rem' }}>
        Revenue — Last 30 Days
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.25} />
              <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: TEXT_MUTED }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: TEXT_MUTED }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number) => [formatCurrency(v), 'Revenue']}
            labelFormatter={formatDate}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#revenueGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryChart({ data }: { data: CategoryPoint[] }) {
  return (
    <div className="admin-card" style={{ height: '260px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: TEXT_SEC, marginBottom: '1rem' }}>
        Products by Category
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            tick={{ fontSize: 11, fill: TEXT_MUTED }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Products']} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
