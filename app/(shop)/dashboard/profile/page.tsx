import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/dashboard/ProfileForm'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'

export const metadata = {
  title: 'Profile Settings | KelalShop',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch complete profile including shopper profile if it exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, shopper_profiles(*)')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Profile Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your account details and public persona.
        </p>
      </div>

      <ProfileForm user={{ ...profile, email: user.email }} />

      {/* Mobile Account Menu (Visible mostly on small screens where Sidebar is hidden) */}
      <div className="mt-8 md:hidden">
        <h2 className="text-lg font-bold text-navy-900 mb-4">Account Menu</h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
          {profile?.role === 'shopper' && (
            <>
              <Link href="/dashboard/billing" className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="font-medium text-navy-900">Billing & Subscription</span>
              </Link>
              <Link href="/dashboard/verification" className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-medium text-navy-900">Identity Verification</span>
              </Link>
            </>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-4 w-full text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
