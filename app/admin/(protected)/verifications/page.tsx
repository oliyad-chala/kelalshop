import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VerificationCard } from '@/components/admin/VerificationCard'
import { ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Verifications' }

/** Extract the storage path from a full public or signed URL, or return the string if it's already a path */
function extractStoragePath(url: string | null): string | null {
  if (!url) return null
  if (!url.startsWith('http')) return url // Already a path
  
  try {
    const u = new URL(url)
    // Path format: /storage/v1/object/(public|sign)/BUCKET/PATH
    const match = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return url // Fallback to returning the string
  }
}

export default async function VerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: pending } = await admin
    .from('shopper_profiles')
    .select(`
      id,
      id_document_url,
      id_document_back_url,
      business_name,
      created_at,
      profiles!inner(full_name)
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  // Generate 1-hour signed URLs server-side for the private id-documents bucket
  const rows = await Promise.all(
    (pending ?? []).map(async (row: any) => {
      const frontPath = extractStoragePath(row.id_document_url)
      const backPath = extractStoragePath(row.id_document_back_url)

      let signedFrontUrl: string | null = null
      let signedBackUrl: string | null = null

      if (frontPath) {
        const { data } = await admin.storage
          .from('id-documents')
          .createSignedUrl(frontPath, 3600)
        signedFrontUrl = data?.signedUrl ?? null
      }
      if (backPath) {
        const { data } = await admin.storage
          .from('id-documents')
          .createSignedUrl(backPath, 3600)
        signedBackUrl = data?.signedUrl ?? null
      }

      return {
        id: row.id,
        fullName: row.profiles?.full_name ?? null,
        businessName: row.business_name,
        createdAt: row.created_at,
        idFrontUrl: signedFrontUrl,
        idBackUrl: signedBackUrl,
      }
    })
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Shopper Verifications</h1>
          <p className="section-subtitle">Review uploaded ID documents and approve or reject shoppers</p>
        </div>
        <span className="admin-badge badge-pending">
          {rows.length} pending
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <ShieldCheck size={40} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>All clear!</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
            No pending verifications at this time.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {rows.map((row) => (
            <VerificationCard
              key={row.id}
              shopperId={row.id}
              fullName={row.fullName}
              businessName={row.businessName}
              createdAt={row.createdAt}
              idFrontUrl={row.idFrontUrl}
              idBackUrl={row.idBackUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}
