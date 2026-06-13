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
  Legend,
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

// ── Light theme palette ──────────────────────────────────────
const ACCENT   = '#5f63f2'
const SUCCESS  = '#10b981'
const WARNING  = '#f59e0b'
const AMBER    = '#f97316'
const GRID     = '#f0f1f5'
const TEXT_MUT = '#8c98b5'
const TEXT_SEC = '#5a6b82'

const CATEGORY_PALETTE = [
  '#5f63f2', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCurrency(v: number) {
  return v >= 1000 ? `ETB ${(v / 1000).toFixed(1)}k` : `ETB ${v.toFixed(0)}`
}

// ── Custom Tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8ecf0',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      fontSize: '0.8rem',
    }}>
      <p style={{ color: TEXT_MUT, marginBottom: '6px', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color ?? ACCENT, fontWeight: 700, margin: '2px 0' }}>
          {formatter ? formatter(entry.value) : entry.value}
          {' '}
          <span style={{ color: TEXT_SEC, fontWeight: 400 }}>{entry.name}</span>
        </p>
      ))}
    </div>
  )
}

// ── Chart Card Wrapper ────────────────────────────────────────
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #f0f1f5',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1f2d3d', margin: 0 }}>{title}</p>
        {subtitle && <p style={{ fontSize: '0.75rem', color: TEXT_MUT, margin: '2px 0 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Revenue Area Chart ────────────────────────────────────────
export function OrderVolumeChart({ data }: { data: OrderVolumePoint[] }) {
  return (
    <ChartCard title="Revenue Trend" subtitle="Last 30 days performance">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={ACCENT} stopOpacity={0.18} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: TEXT_MUT }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: TEXT_MUT }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            content={<CustomTooltip formatter={formatCurrency} />}
            labelFormatter={formatDate}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={ACCENT}
            strokeWidth={2.5}
            fill="url(#revenueGrad)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: ACCENT }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Category Horizontal Bar Chart ────────────────────────────
export function CategoryChart({ data }: { data: CategoryPoint[] }) {
  return (
    <ChartCard title="Top Categories" subtitle="Products by category">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: TEXT_MUT }} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="name"
            type="category"
            width={110}
            tick={{ fontSize: 11, fill: TEXT_MUT }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip formatter={(v: number) => `${v} products`} />} />
          <Bar dataKey="count" name="Products" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Top Sellers Bar Chart ─────────────────────────────────────
export function TopSellersChart({ data }: { data: TopSellerPoint[] }) {
  return (
    <ChartCard title="Seller Revenue" subtitle="Top sellers by earnings">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="sellerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={SUCCESS} stopOpacity={1} />
              <stop offset="100%" stopColor={SUCCESS} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: TEXT_MUT }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: TEXT_MUT }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
          <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill="url(#sellerGrad)" maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Visitor & Conversion Line Chart ──────────────────────────
export function VisitorChart({ data }: { data: { name: string; visitors: number; conversion: number }[] }) {
  return (
    <ChartCard title="Traffic & Conversions" subtitle="This week's visitor analytics">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: TEXT_MUT }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: TEXT_MUT }} axisLine={false} tickLine={false} width={48} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: TEXT_MUT }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '0.75rem', color: TEXT_SEC, paddingTop: '8px' }}
          />
          <Line yAxisId="left"  type="monotone" dataKey="visitors"   name="Visitors"        stroke={ACCENT}  strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
          <Line yAxisId="right" type="monotone" dataKey="conversion" name="Conversion Rate%" stroke={WARNING} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
