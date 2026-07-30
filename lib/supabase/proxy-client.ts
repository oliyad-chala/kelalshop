import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import { isAdminOnlyPath, isAdminPortalRole } from '@/lib/utils/admin-roles'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Missing env vars — do NOT silently allow all traffic through
    console.error('[Middleware] Missing Supabase env vars — blocking protected routes')
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Device verification block ───────────────────────────────────────────────
  const isPageRequest = request.method === 'GET' && !pathname.startsWith('/_next') && !pathname.startsWith('/api')
  if (user && isPageRequest && pathname !== '/auth/verify-device') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('requires_verification')
      .eq('id', user.id)
      .single()

    if (profile?.requires_verification && (pathname.startsWith('/dashboard') || pathname.startsWith('/requests'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/verify-device'
      return NextResponse.redirect(url)
    }
  }

  // ── Admin RBAC ──────────────────────────────────────────────────────────────
  // All /admin/* routes except /admin/login require admin or staff role
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!isAdminPortalRole(profile?.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    if (profile?.role === 'staff' && isAdminOnlyPath(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // If authenticated admin/staff tries to access /admin/login → redirect to dashboard
  if (pathname === '/admin/login' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (isAdminPortalRole(profile?.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ── Shop routes ─────────────────────────────────────────────────────────────
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    const url = request.nextUrl.clone()
    const redirectTo = url.searchParams.get('redirectTo') ?? url.searchParams.get('redirect')
    const safePath =
      redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/dashboard'
    url.pathname = safePath
    url.search = ''
    return NextResponse.redirect(url)
  }

  // ── Security headers (shop routes only — admin returns above without CSP) ──
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  
  const isTelegramRoute = pathname.startsWith('/telegram')
  const hasTgSession = request.cookies.has('tg_session') || request.nextUrl.searchParams.has('tgWebApp')
  const isTelegram = isTelegramRoute || hasTgSession
  
  if (!isTelegram) {
    supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  }
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  const scriptSrc = isTelegram
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://telegram.org https://*.telegram.org"
    : "script-src 'self' 'unsafe-eval' 'unsafe-inline'"

  const frameAncestors = isTelegram
    ? "frame-ancestors 'self' https://telegram.org https://*.telegram.org"
    : "frame-ancestors 'none'"

  const frameSrc = isTelegram
    ? "frame-src 'self' https://telegram.org https://*.telegram.org"
    : "frame-src 'none'"

  const connectSrc = isTelegram
    ? `connect-src 'self' ${supabaseOrigin} wss: https://accounts.google.com https://oauth2.googleapis.com https://api.telegram.org`
    : `connect-src 'self' ${supabaseOrigin} wss: https://accounts.google.com https://oauth2.googleapis.com`

  supabaseResponse.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Campaign/product images: Supabase storage + common external banner hosts
      [
        "img-src 'self' data: blob:",
        supabaseOrigin,
        'https://*.supabase.co',
        'https://lh3.googleusercontent.com',
        'https://googleusercontent.com',
        'https://*.pinimg.com',
        'https://images.unsplash.com',
      ].filter(Boolean).join(' '),
      connectSrc,
      frameSrc,
      frameAncestors,
    ].join('; ')
  )

  if (isTelegramRoute) {
    supabaseResponse.cookies.set('tg_session', 'true', {
      path: '/',
      maxAge: 86400, // 24 hours
      sameSite: 'none',
      secure: true,
    })
  }

  return supabaseResponse
}
