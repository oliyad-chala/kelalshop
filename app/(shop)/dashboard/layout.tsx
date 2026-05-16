import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import type { Profile } from '@/types/app.types'

export const metadata = {
  title: 'Dashboard | KelalShop',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch total unread messages count for the nav badge
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar user={profile as Profile} unreadMessages={unreadMessages ?? 0} />

      {/* Main content — extra bottom padding on mobile for the nav bar */}
      <div className="flex-1 w-full p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto overflow-x-hidden pb-24 md:pb-10">
        {children}
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <MobileNav user={profile as Profile} unreadMessages={unreadMessages ?? 0} />
    </div>
  )
}
