import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function generateDeviceFingerprint(): Promise<{ fingerprint: string; ip: string; userAgent: string }> {
  const headersList = await headers()

  const ip = headersList.get('x-forwarded-for')?.split(',')[0]
          || headersList.get('x-real-ip')
          || '127.0.0.1'

  const userAgent = headersList.get('user-agent') || 'Unknown User Agent'
  const acceptLanguage = headersList.get('accept-language') || 'en-US'

  const rawFingerprint = `${ip}|${userAgent}|${acceptLanguage}`
  const fingerprint = crypto.createHash('sha256').update(rawFingerprint).digest('hex')

  return { fingerprint, ip, userAgent }
}

export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error('[checkRateLimit] RPC failed:', error.message)
    // Fail open for availability if migration not applied yet
    return true
  }

  return data === true
}
