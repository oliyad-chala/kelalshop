import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils/formatters'
import { RealtimeListener } from '@/components/dashboard/RealtimeListener'

export const metadata = {
  title: 'Dashboard | KelalShop',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, shopper_profiles(*)')
    .eq('id', user.id)
    .single()

  const isShopper = profile?.role === 'shopper'
  const shopperProfile = Array.isArray(profile?.shopper_profiles) 
    ? profile.shopper_profiles[0] 
    : profile?.shopper_profiles
  const verificationStatus = shopperProfile?.verification_status ?? 'unverified'
  const isVerified = verificationStatus === 'verified'

  // ─── Shopper Data ────────────────────────────────────────────────────
  let stats: { title: string; value: string; description: string; icon: string }[] = []
  let recentOrders: any[] = []
  let recentRequests: any[] = []

  if (isShopper) {
    const [
      { data: revenueRows },
      { count: activeOrdersCount },
      { count: listingsCount },
      { data: orders },
      { data: requests },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('amount')
        .eq('shopper_id', user.id)
        .eq('status', 'delivered'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('shopper_id', user.id)
        .in('status', ['pending', 'accepted', 'shipped']),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shopper_id', user.id)
        .eq('is_available', true),
      supabase
        .from('orders')
        .select('*, products(name), buyer:buyer_id(full_name)')
        .eq('shopper_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('requests')
        .select('*, categories(name), profiles:buyer_id(full_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const gross = revenueRows?.reduce((sum, o) => sum + Number(o.amount), 0) ?? 0
    const net = gross * 0.92 // 8% avg commission deducted
    const trustScore = profile?.trust_score ?? 0

    recentOrders = orders ?? []
    recentRequests = requests ?? []

    stats = [
      {
        title: 'Total Revenue',
        value: formatPrice(net),
        description: 'After platform commission',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Active Orders',
        value: String(activeOrdersCount ?? 0),
        description: 'Pending, accepted & shipped',
        icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
      },
      {
        title: 'Available Listings',
        value: String(listingsCount ?? 0),
        description: 'Visible to buyers',
        icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      },
      {
        title: 'Trust Score',
        value: `${trustScore} / 5 ★`,
        description: 'Based on buyer reviews',
        icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      },
    ]
  } else {
    // ─── Buyer Data ─────────────────────────────────────────────────────
    const [
      { count: activeOrders },
      { count: openRequests },
      { count: unreadMsgs },
      { data: orders },
      { data: requests },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .in('status', ['pending', 'accepted', 'shipped']),
      supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .eq('status', 'open'),
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false),
      supabase
        .from('orders')
        .select('*, products(name), shopper:shopper_id(full_name)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('requests')
        .select('*, categories(name)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    recentOrders = orders ?? []
    recentRequests = requests ?? []

    stats = [
      {
        title: 'Active Orders',
        value: String(activeOrders ?? 0),
        description: 'Being processed or shipped',
        icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
      },
      {
        title: 'Open Requests',
        value: String(openRequests ?? 0),
        description: 'Awaiting a shopper',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      },
      {
        title: 'Unread Messages',
        value: String(unreadMsgs ?? 0),
        description: 'From orders & chats',
        icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
      },
    ]
  }

  return (
    <div className="space-y-8 fade-in">
      <RealtimeListener userId={user.id} />
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, <span className="font-medium text-navy-900">{profile?.full_name}</span>.
          </p>
        </div>
        {isShopper && isVerified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            ✔ Verified Seller
          </span>
        )}
      </div>

      {/* Verification Alerts */}
      {isShopper && verificationStatus === 'unverified' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-amber-900">Verify your identity</h3>
            <p className="text-amber-800/80 mt-1 text-sm">Complete verification to start receiving orders and listing products.</p>
          </div>
          <Link href="/dashboard/verification" className="shrink-0">
            <Button variant="primary">Start Verification</Button>
          </Link>
        </div>
      )}
      {isShopper && verificationStatus === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h3 className="font-semibold text-blue-900">Verification Under Review</h3>
          <p className="text-blue-800/80 text-sm mt-1">Your documents are being reviewed. This usually takes 1–2 business days.</p>
        </div>
      )}

      {/* Quick Actions for Sellers */}
      {isShopper && (
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/listings/new" className="w-full sm:w-auto">
            <Button variant="primary" className="shadow-md shadow-amber-500/20 w-full sm:w-auto">
              <svg className="w-5 h-5 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </Button>
          </Link>
          <Link href="/dashboard/orders" className="hidden md:block w-full sm:w-auto">
            <Button variant="outline" className="bg-white w-full sm:w-auto">
              <svg className="w-5 h-5 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Orders
            </Button>
          </Link>
          <Link href="/dashboard/chat" className="hidden md:block w-full sm:w-auto">
            <Button variant="outline" className="bg-white w-full sm:w-auto">
              <svg className="w-5 h-5 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages
            </Button>
          </Link>
          <Link href="/dashboard/listings" className="hidden md:block w-full sm:w-auto">
            <Button variant="outline" className="bg-white w-full sm:w-auto">
              <svg className="w-5 h-5 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
              </svg>
              Listings
            </Button>
          </Link>
          <Link href="/dashboard/flash-deals" className="w-full sm:w-auto">
            <Button variant="outline" className="bg-white w-full sm:w-auto">
              <svg className="w-5 h-5 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Flash Deals
            </Button>
          </Link>
          <Link href="/dashboard/billing" className="w-full sm:w-auto">
            <Button variant="outline" className="bg-white w-full sm:w-auto">
              <svg className="w-5 h-5 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Billing
            </Button>
          </Link>
          <Link href="/dashboard/verification" className="w-full sm:w-auto">
            <Button variant="outline" className="bg-white w-full sm:w-auto">
              <svg className="w-5 h-5 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verification
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-navy-900">Recent Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your latest transactions</p>
            </div>
            <Link href="/dashboard/orders" className="text-xs font-semibold text-amber-600 hover:underline">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm gap-2">
              <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              No recent orders found.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-900 truncate">{order.products?.name || 'Custom Request Order'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isShopper ? order.buyer?.full_name : order.shopper?.full_name} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-semibold text-navy-900">{formatPrice(order.amount)}</span>
                    <Badge variant={getOrderStatusColor(order.status) as any} size="sm" className="capitalize">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-navy-900">
                {isShopper ? 'Recent Find Requests' : 'Your Open Requests'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isShopper ? 'Buyer requests — click to respond' : 'Items you asked shoppers to find'}
              </p>
            </div>
            <Link href="/dashboard/requests" className="text-xs font-semibold text-amber-600 hover:underline">View all →</Link>
          </div>
          {recentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm gap-2">
              <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              {isShopper ? 'No open buyer requests right now.' : "You haven't posted any requests yet."}
              {!isShopper && (
                <Link href="/dashboard/requests/new" className="mt-1">
                  <Button variant="outline" size="sm">Create Request</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentRequests.map((req: any) => (
                <Link key={req.id} href="/dashboard/requests" className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-900 truncate group-hover:text-amber-600 transition-colors">{req.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isShopper ? req.profiles?.full_name : req.categories?.name ?? 'Uncategorised'} · {formatDate(req.created_at)}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0">
                    {req.budget ? (
                      <span className="text-sm font-semibold text-navy-900">{formatPrice(req.budget)}</span>
                    ) : (
                      <span className="text-xs text-slate-400">No budget</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
