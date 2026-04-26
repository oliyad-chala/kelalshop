import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { VerificationForm } from '@/components/dashboard/VerificationForm'

export const metadata = {
  title: 'Identity Verification | KelalShop',
}

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('role, phone, shopper_profiles(verification_status)')
    .eq('id', user.id)
    .single()

  if (rawProfile?.role !== 'shopper') redirect('/dashboard')

  const profile = rawProfile as {
    role: string
    phone: string | null
    shopper_profiles: { verification_status: string }[] | null
  }

  const sp = Array.isArray(profile.shopper_profiles) ? profile.shopper_profiles[0] : profile.shopper_profiles
  const status = sp?.verification_status || 'unverified'

  const statusVariant = {
    verified: 'success',
    pending: 'warning',
    rejected: 'danger',
    unverified: 'default',
  }[status] as 'success' | 'warning' | 'danger' | 'default'

  return (
    <div className="max-w-3xl space-y-6 fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Identity Verification</h1>
          <Badge variant={statusVariant} size="md" className="capitalize mt-0.5">{status}</Badge>
        </div>
        <p className="text-slate-500 text-sm">
          Verify your identity to unlock full shopper features: creating listings, receiving orders, and contacting buyers.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {['Upload ID', 'Phone Number', 'Seller Agreement'].map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">{i + 1}</span>
            {step}
            {i < 2 && <span className="text-slate-300">—</span>}
          </span>
        ))}
      </div>

      {/* ── Verified ──────────────────────────────────────────── */}
      {status === 'verified' ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-5 border-2 border-green-200">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">✔ You are a Verified Seller!</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Your identity has been confirmed. The Verified badge now appears on your profile and all your product listings.
            </p>
          </div>
        </Card>

      /* ── Pending ────────────────────────────────────────────── */
      ) : status === 'pending' ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-5 border-2 border-amber-200">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">Review in Progress</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Your documents are being reviewed by our team. This usually takes 1–2 business days. You will be notified once complete.
            </p>
          </div>
        </Card>

      /* ── Form (unverified / rejected) ──────────────────────── */
      ) : (
        <VerificationForm defaultPhone={profile?.phone ?? ''} isRejected={status === 'rejected'} />
      )}
    </div>
  )
}
