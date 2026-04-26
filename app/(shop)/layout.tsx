import { createClient } from '@/lib/supabase/server'
import { LayoutWrapper } from '@/components/layout/LayoutWrapper'
import type { Profile } from '@/types/app.types'
import '../globals.css'

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data as Profile | null
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 antialiased selection:bg-amber-200 selection:text-amber-900">
      <LayoutWrapper profile={profile}>{children}</LayoutWrapper>
    </div>
  )
}
