import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/dashboard/ProfileForm'

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
    </div>
  )
}
