import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VerifyDeviceForm from './VerifyDeviceForm'

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
          <p className="mt-2 text-slate-500 text-sm leading-relaxed">
            We noticed you are trying to sign in from a new device or location. 
            To protect your account, we have temporarily locked your access.
          </p>
        </div>

        <VerifyDeviceForm email={user.email ?? ''} />
      </div>
    </div>
  )
}
