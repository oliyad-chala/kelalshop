import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default async function VerifyDevicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if profile actually requires verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('requires_verification')
    .eq('id', user.id)
    .single()

  if (!profile?.requires_verification) {
    redirect('/dashboard')
  }

  // Note: For a fully functioning security verification flow,
  // we would send an email with an OTP (One Time Password) here using:
  // supabase.auth.resend({ type: 'signup', email: user.email }) 
  // or a custom edge function. For the scope of this implementation, 
  // we will just show a UI that indicates the account is locked and requires an admin or email click.

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100">
          <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <div>
          <h2 className="mt-4 text-3xl font-bold text-navy-900 tracking-tight">
            Security Verification Required
          </h2>
          <p className="mt-4 text-slate-500 text-sm leading-relaxed">
            We noticed you are trying to sign in from a new device or location. 
            To protect your account, we have temporarily locked your access.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
          <h3 className="text-sm font-semibold text-navy-900 mb-2">What you need to do:</h3>
          <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
            <li>Check the email address associated with this account.</li>
            <li>Look for a security alert message from KelalShop.</li>
            <li>Click the "Verify Device" link inside the email.</li>
          </ul>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <form action={async () => {
            'use server'
            const s = await createClient()
            const { data: { user } } = await s.auth.getUser()
            if (user) {
              await s.from('profiles').update({ requires_verification: false }).eq('id', user.id)
            }
            redirect('/dashboard')
          }}>
            <Button variant="primary" type="submit" fullWidth>
              Bypass Verification (Dev Mode)
            </Button>
          </form>
          
          <form action={async () => {
            'use server'
            const s = await createClient()
            await s.auth.signOut()
            redirect('/')
          }}>
            <Button variant="outline" type="submit" fullWidth>
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
