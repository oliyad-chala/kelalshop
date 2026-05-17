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
  LineChart,
  Line,
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

interface TopSellerPoint {
  name: string
  revenue: number
}

const ACCENT = '#6366f1'
const SUCCESS = '#10b981'
const WARNING = '#f59e0b'
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
        Top Selling Categories
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

export function TopSellersChart({ data }: { data: TopSellerPoint[] }) {
  return (
    <div className="admin-card" style={{ height: '260px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: TEXT_SEC, marginBottom: '1rem' }}>
        Seller Performance (Revenue)
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: TEXT_MUTED }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={SUCCESS} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function VisitorChart() {
  // Mock data for Visitor Analytics
  const mockData = [
    { name: 'Mon', visitors: 4000, conversion: 2.4 },
    { name: 'Tue', visitors: 3000, conversion: 2.2 },
    { name: 'Wed', visitors: 5000, conversion: 2.8 },
    { name: 'Thu', visitors: 4500, conversion: 2.6 },
    { name: 'Fri', visitors: 6000, conversion: 3.1 },
    { name: 'Sat', visitors: 7000, conversion: 3.4 },
    { name: 'Sun', visitors: 6500, conversion: 3.2 },
  ];

  return (
    <div className="admin-card" style={{ height: '260px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: TEXT_SEC, marginBottom: '1rem' }}>
        Visitor & Conversion Analytics (This Week)
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={mockData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: TEXT_MUTED }} axisLine={false} tickLine={false} width={40} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: TEXT_MUTED }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line yAxisId="left" type="monotone" dataKey="visitors" stroke={WARNING} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Visitors" />
          <Line yAxisId="right" type="monotone" dataKey="conversion" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Conversion Rate" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
