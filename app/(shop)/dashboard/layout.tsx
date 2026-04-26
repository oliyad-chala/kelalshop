import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
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

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
      <Sidebar user={profile as Profile} />
      <div className="flex-1 w-full p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
