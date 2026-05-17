import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VerificationCard } from '@/components/admin/VerificationCard'
import { ShieldCheck, History, Clock } from 'lucide-react'
import Link from 'next/link'
import { SellerDataTable } from '@/components/admin/sellers/SellerDataTable'

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

export default async function VerificationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const resolvedParams = await searchParams
  const tab = resolvedParams.tab || 'pending'

  const admin = createAdminClient()

  if (tab === 'history') {
    const { data: history } = await admin
      .from('shopper_profiles')
      .select(`
        id,
        business_name,
        verification_status,
        created_at,
        updated_at,
        subscription_plan,
        subscription_expires_at,
        profiles!inner(full_name)
      `)
      .in('verification_status', ['verified', 'rejected'])
      .order('updated_at', { ascending: false })

    const rows = (history ?? []).map((s: any) => ({
      id: s.id,
      full_name: s.profiles?.full_name ?? '—',
      business_name: s.business_name ?? '—',
      subscription_plan: s.subscription_plan,
      subscription_expires_at: s.subscription_expires_at,
      created_at: s.updated_at, // Use updated_at as the action date
      verification_status: s.verification_status,
    }))

    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="section-title">Verification History</h1>
            <p className="section-subtitle">Review previously approved or rejected shoppers</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/admin/verifications?tab=pending" className="admin-btn admin-btn-outline">
              <Clock size={14} /> Pending Queue
            </Link>
            <Link href="/admin/verifications?tab=history" className="admin-btn admin-btn-primary">
              <History size={14} /> History
            </Link>
          </div>
        </div>
        <SellerDataTable rows={rows} />
      </div>
    )
  }

  // Pending queue
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/admin/verifications?tab=pending" className="admin-btn admin-btn-primary">
            <Clock size={14} /> Pending ({rows.length})
          </Link>
          <Link href="/admin/verifications?tab=history" className="admin-btn admin-btn-outline">
            <History size={14} /> History
          </Link>
        </div>
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
