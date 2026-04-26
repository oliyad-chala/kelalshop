'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import type { Profile } from '@/types/app.types'

export function LayoutWrapper({ 
  children, 
  profile 
}: { 
  children: React.ReactNode
  profile: Profile | null 
}) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')

  return (
    <>
      {!isAuthPage && <Navbar user={profile} />}
      {children}
      {!isAuthPage && <Footer />}
    </>
  )
}
