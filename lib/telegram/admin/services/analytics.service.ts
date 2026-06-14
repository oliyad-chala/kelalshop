import { getTelegramSupabase } from '../../core/supabase-admin'
import { formatEtb } from '../../core/telegram-format'

const DELIVERED_STATUSES = ['delivered'] as const

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek() {
  const d = startOfToday()
  d.setDate(d.getDate() - d.getDay())
  return d
}

function startOfMonth() {
  const d = startOfToday()
  d.setDate(1)
  return d
}

async function sumRevenue(since: Date) {
  const supabase = getTelegramSupabase()
  const { data } = await supabase
    .from('orders')
    .select('amount')
    .gte('created_at', since.toISOString())
    .eq('status', 'delivered')

  return (data ?? []).reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
}

export async function getDashboardMetrics() {
  const supabase = getTelegramSupabase()
  const today = startOfToday()

  const [
    { count: totalUsers },
    { count: activeSellers },
    { count: totalProducts },
    { count: ordersToday },
    { count: pendingApprovals },
    { count: openTickets },
    { count: failedLogins },
    revenueToday,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('shopper_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('support_sessions').select('*', { count: 'exact', head: true }).neq('status', 'closed'),
    supabase.from('login_attempts').select('*', { count: 'exact', head: true }).eq('is_success', false).gte('created_at', today.toISOString()),
    sumRevenue(today),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    activeSellers: activeSellers ?? 0,
    totalProducts: totalProducts ?? 0,
    ordersToday: ordersToday ?? 0,
    revenueToday,
    pendingApprovals: pendingApprovals ?? 0,
    openTickets: openTickets ?? 0,
    securityAlerts: failedLogins ?? 0,
  }
}

export async function getAnalyticsReport() {
  const supabase = getTelegramSupabase()
  const today = startOfToday()
  const week = startOfWeek()
  const month = startOfMonth()

  const [
    { count: ordersToday },
    revenueToday,
    revenueWeek,
    revenueMonth,
    { count: pendingProducts },
    { count: pendingPayments },
    { count: newUsersToday },
    { count: newUsersWeek },
    topSellersData,
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    sumRevenue(today),
    sumRevenue(week),
    sumRevenue(month),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', week.toISOString()),
    supabase
      .from('orders')
      .select('shopper_id, amount')
      .eq('status', 'delivered')
      .gte('created_at', month.toISOString()),
  ])

  const sellerTotals = new Map<string, number>()
  for (const o of topSellersData.data ?? []) {
    if (!o.shopper_id) continue
    sellerTotals.set(o.shopper_id, (sellerTotals.get(o.shopper_id) ?? 0) + Number(o.amount))
  }

  const topSellerIds = [...sellerTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  let topSellers: { name: string; revenue: number }[] = []
  if (topSellerIds.length) {
    const { data: profiles } = await supabase
      .from('shopper_profiles')
      .select('id, business_name')
      .in('id', topSellerIds)

    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.business_name || 'Unknown']))
    topSellers = topSellerIds.map((id) => ({
      name: nameMap.get(id) ?? 'Unknown',
      revenue: sellerTotals.get(id) ?? 0,
    }))
  }

  return {
    ordersToday: ordersToday ?? 0,
    revenueToday,
    revenueWeek,
    revenueMonth,
    pendingProducts: pendingProducts ?? 0,
    pendingPayments: pendingPayments ?? 0,
    newUsersToday: newUsersToday ?? 0,
    newUsersWeek: newUsersWeek ?? 0,
    topSellers,
  }
}

export function formatAnalyticsHtml(report: Awaited<ReturnType<typeof getAnalyticsReport>>) {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  let text =
    `📊 <b>KelalShop Analytics</b>\n` +
    `📅 ${date}\n\n` +
    `🛒 Orders Today: <b>${report.ordersToday}</b>\n` +
    `💰 Revenue Today: <b>${formatEtb(report.revenueToday)}</b>\n` +
    `📈 Revenue This Week: <b>${formatEtb(report.revenueWeek)}</b>\n` +
    `📆 Revenue This Month: <b>${formatEtb(report.revenueMonth)}</b>\n\n`

  if (report.topSellers.length) {
    text += `🏆 <b>Top Sellers (this month)</b>\n`
    report.topSellers.forEach((s, i) => {
      text += `${i + 1}. ${s.name} — ${formatEtb(s.revenue)}\n`
    })
    text += '\n'
  }

  text +=
    `⏳ Pending: <b>${report.pendingProducts}</b> products · <b>${report.pendingPayments}</b> payments\n` +
    `👥 New Users: <b>${report.newUsersToday}</b> today · <b>${report.newUsersWeek}</b> this week`

  return text
}

export function formatDashboardHtml(m: Awaited<ReturnType<typeof getDashboardMetrics>>) {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    `📊 <b>KelalShop Dashboard — ${date}</b>\n\n` +
    `👥 Total Users: <b>${m.totalUsers}</b>\n` +
    `🏪 Active Sellers: <b>${m.activeSellers}</b>\n` +
    `📦 Total Products: <b>${m.totalProducts}</b>\n\n` +
    `🛒 Orders Today: <b>${m.ordersToday}</b>\n` +
    `💰 Revenue Today: <b>${formatEtb(m.revenueToday)}</b>\n` +
    `⏳ Pending Approvals: <b>${m.pendingApprovals}</b>\n\n` +
    `🎫 Open Tickets: <b>${m.openTickets}</b>\n` +
    `🔒 Failed Logins Today: <b>${m.securityAlerts}</b>`
  )
}
