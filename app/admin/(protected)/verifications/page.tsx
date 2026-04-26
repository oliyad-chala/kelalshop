import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VerificationCard } from '@/components/admin/VerificationCard'
import { ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Verifications' }

export default async function VerificationsPage() {
  // Auth guard
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

  const rows = (pending ?? []) as any[]

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
              fullName={row.profiles?.full_name ?? null}
              businessName={row.business_name}
              createdAt={row.created_at}
              idFrontUrl={row.id_document_url}
              idBackUrl={row.id_document_back_url}
            />
          ))}
        </div>
      )}
    </div>
  )
}
