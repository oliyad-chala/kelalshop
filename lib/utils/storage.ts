import { createAdminClient } from '@/lib/supabase/admin'

const RECEIPT_BUCKET = 'receipts'
const SIGNED_URL_TTL = 3600

/** Extract storage object path from a legacy public URL or return path as-is. */
export function extractReceiptStoragePath(receiptUrl: string): string | null {
  if (!receiptUrl?.trim()) return null
  const trimmed = receiptUrl.trim()
  if (!trimmed.startsWith('http')) return trimmed

  try {
    const url = new URL(trimmed)
    const marker = `/object/public/${RECEIPT_BUCKET}/`
    const signedMarker = `/object/sign/${RECEIPT_BUCKET}/`
    const idx = url.pathname.indexOf(marker)
    if (idx !== -1) return decodeURIComponent(url.pathname.slice(idx + marker.length))
    const sidx = url.pathname.indexOf(signedMarker)
    if (sidx !== -1) return decodeURIComponent(url.pathname.slice(sidx + signedMarker.length))
    const parts = url.pathname.split(`/${RECEIPT_BUCKET}/`)
    if (parts.length > 1) return decodeURIComponent(parts[parts.length - 1])
  } catch {
    return null
  }
  return null
}

/** Create a short-lived signed URL for a receipt (admin/server only). */
export async function getSignedReceiptUrl(receiptUrl: string | null): Promise<string | null> {
  if (!receiptUrl) return null
  const path = extractReceiptStoragePath(receiptUrl)
  if (!path) return null

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
