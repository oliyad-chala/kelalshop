import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function generateDeviceFingerprint(): Promise<{ fingerprint: string; ip: string; userAgent: string }> {
  const headersList = await headers()
  
  // Try to get IP from standard forwarding headers, fallback to a local placeholder
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] 
          || headersList.get('x-real-ip') 
          || '127.0.0.1'
          
  const userAgent = headersList.get('user-agent') || 'Unknown User Agent'
  const acceptLanguage = headersList.get('accept-language') || 'en-US'

  // Create a stable hash based on IP, UA, and Language
  const rawFingerprint = `${ip}|${userAgent}|${acceptLanguage}`
  const fingerprint = crypto.createHash('sha256').update(rawFingerprint).digest('hex')

  return { fingerprint, ip, userAgent }
}

export async function checkRateLimit(identifier: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const supabase = await createClient()
  
  // 1. Clean up expired limits for this identifier
  await supabase
    .from('rate_limits')
    .delete()
    .eq('identifier', identifier)
    .lt('expires_at', new Date().toISOString())

  // 2. Fetch current record
  const { data: limitRecord } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .single()

  if (!limitRecord) {
    // Create new record
    const expiresAt = new Date(Date.now() + windowSeconds * 1000).toISOString()
    await supabase.from('rate_limits').insert({
      identifier,
      requests: 1,
      expires_at: expiresAt
    })
    return true // Allowed
  }

  // 3. Check if exceeded
  if (limitRecord.requests >= maxRequests) {
    return false // Blocked
  }

  // 4. Increment
  await supabase
    .from('rate_limits')
    .update({ requests: limitRecord.requests + 1 })
    .eq('identifier', identifier)

  return true // Allowed
}
