import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

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

  // Fetch some aggregate data for stats (mocked counts for demo, normally would use actual queries)
  const stats = isShopper ? [
    { title: 'Total Revenue (ETB)', value: '0', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Active Orders', value: '0', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { title: 'Available Listings', value: '0', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z' },
    { title: 'Trust Score', value: profile?.trust_score ?? 'N/A', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  ] : [
    { title: 'Active Orders', value: '0', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { title: 'Open Requests', value: '0', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { title: 'Unread Messages', value: '0', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ]

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-1">
          Welcome back, <span className="font-medium text-navy-900">{profile?.full_name}</span>.
        </p>
      </div>

      {/* Shopper Verification Alert */}
      {isShopper && profile.shopper_profiles[0]?.verification_status === 'unverified' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
             <h3 className="text-lg font-semibold text-amber-900">Verify your identity</h3>
             <p className="text-amber-800/80 mt-1">You need to verify your ID before you can start receiving orders or contacting buyers.</p>
          </div>
          <Link href="/dashboard/verification" className="shrink-0">
             <Button variant="primary">Start Verification</Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="min-h-[300px]">
          <CardHeader title="Recent Orders" subtitle="Your latest transactions" />
          <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No recent orders found.</p>
            {!isShopper && (
              <Link href="/products" className="mt-4">
                 <Button variant="outline" size="sm">Browse Products</Button>
              </Link>
            )}
          </div>
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader title={isShopper ? "Recent Requests" : "Your Open Requests"} subtitle={isShopper ? "Opportunities matching your categories" : "Requests waiting for a shopper"} />
          <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No requests found.</p>
            {!isShopper && (
              <Link href="/dashboard/requests/new" className="mt-4">
                 <Button variant="outline" size="sm">Create a Request</Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
