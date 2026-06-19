/**
 * Blocklist of common disposable and temporary email domains.
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  '10minutemail.com',
  'dispostable.com',
  'getairmail.com',
  'sharklasers.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'trashmail.com',
  'tempr.email',
  'owlymail.com',
  'burnermail.io',
  'generator.email',
  'maildrop.cc',
  'mailnesia.com',
  'temp-mail.org',
  'fakeinbox.com',
  'throwawaymail.com',
  'mailcatch.com',
  'inboxkitten.com'
])

/**
 * Checks if a given email address belongs to a disposable/temporary email provider.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email) return false
  const parts = email.trim().toLowerCase().split('@')
  if (parts.length !== 2) return false
  const domain = parts[1]
  return DISPOSABLE_DOMAINS.has(domain)
}
