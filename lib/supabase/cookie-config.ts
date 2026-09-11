import type { CookieOptionsWithName } from '@supabase/ssr'

/**
 * Standardized cookie configuration for KelalShop.
 * Ensures cookies are marked Secure in production, use SameSite=Lax for OAuth resilience,
 * and maintain scoped paths without leaking sensitive secrets to unauthorized origins.
 */

export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Extracts the Supabase project reference from the URL
 * (e.g. 'https://ovsfbaqpvpizriuezjcv.supabase.co' -> 'ovsfbaqpvpizriuezjcv')
 */
export function getSupabaseProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return 'default'
  try {
    const hostname = new URL(url).hostname
    return hostname.split('.')[0] || 'default'
  } catch {
    return 'default'
  }
}

/**
 * Default auth cookie base name: sb-<ref>-auth-token
 */
export function getAuthCookieName(): string {
  return `sb-${getSupabaseProjectRef()}-auth-token`
}

/**
 * Centralized production-hardened cookie options for Supabase clients.
 */
export function getSecureCookieOptions(): CookieOptionsWithName {
  return {
    name: getAuthCookieName(),
    path: '/',
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  }
}

/**
 * Cookie consent token name
 */
export const COOKIE_CONSENT_KEY = 'kelal_cookie_consent'
