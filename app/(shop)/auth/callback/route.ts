import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth callback — Supabase redirects here after Google consent.
 * Exchanges the ?code= for a session, then sends the user to their destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Guard against open redirects — only allow same-origin paths
  const safePath =
    next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${safePath}`)
    }
  }

  // Something went wrong — send to login with an error flag
  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
}
