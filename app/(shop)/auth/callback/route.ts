import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * OAuth callback — Supabase redirects here after Google consent.
 * Exchanges the ?code= for a session, then sends the user to their destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const roleParam = searchParams.get('role')

  const cookieStore = await cookies()
  const roleCookie = cookieStore.get('kelal_signup_role')?.value
  const desiredRole =
    roleParam === 'shopper' || roleCookie === 'shopper'
      ? 'shopper'
      : roleParam === 'buyer' || roleCookie === 'buyer'
      ? 'buyer'
      : null

  // Guard against open redirects — only allow same-origin paths
  const safePath =
    next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin' || profile?.role === 'staff') {
          await supabase.auth.signOut()
          const res = NextResponse.redirect(
            `${origin}/auth/login?error=admin_restricted`
          )
          res.cookies.delete('kelal_signup_role')
          return res
        }

        // If the user selected 'shopper' (seller) during signup, upgrade their profile to seller
        if (desiredRole === 'shopper' && profile?.role !== 'shopper') {
          const admin = createAdminClient()

          await admin
            .from('profiles')
            .update({ role: 'shopper' })
            .eq('id', user.id)

          await admin.from('shopper_profiles').upsert(
            {
              id: user.id,
              delivery_time_days: 14,
            },
            { onConflict: 'id' }
          )

          await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...(user.user_metadata || {}),
              role: 'shopper',
            },
          })
        }
      }

      const response = NextResponse.redirect(`${origin}${safePath}`)
      response.cookies.delete('kelal_signup_role')
      return response
    }
  }

  // Something went wrong — send to login with an error flag
  const errorResponse = NextResponse.redirect(
    `${origin}/auth/login?error=oauth_failed`
  )
  errorResponse.cookies.delete('kelal_signup_role')
  return errorResponse
}
