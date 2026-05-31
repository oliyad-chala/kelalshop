'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { redirectQueryString } from '@/lib/utils/auth-redirect'

type Props = {
  mode: 'login' | 'signup'
  className?: string
  children: React.ReactNode
}

export function AuthSwitchLink({ mode, className, children }: Props) {
  const searchParams = useSearchParams()
  const qs = redirectQueryString(searchParams)
  const href = mode === 'login' ? `/auth/login${qs}` : `/auth/signup${qs}`

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
