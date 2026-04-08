'use client'

import { useActionState } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { updateProfile } from '@/lib/actions/profile'

const initialState = {
  error: '',
  success: '',
}

export function ProfileForm({ user }: { user: any }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState)
  const isShopper = user.role === 'shopper'

  return (
    <form action={formAction} className="space-y-8 fade-in">
      {state?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm">
          {state.success}
        </div>
      )}

      <Card>
         <CardHeader title="Personal Information" subtitle="Update your basic profile details." />
         
         <div className="flex flex-col sm:flex-row gap-8 mb-8">
            <div className="flex flex-col gap-3 items-center">
               <Avatar src={user.avatar_url} name={user.full_name} size="xl" />
               <Button variant="outline" size="sm" type="button" className="text-xs">
                 Change Avatar
               </Button>
            </div>
            
            <div className="flex-1 space-y-4">
               <div className="grid sm:grid-cols-2 gap-4">
                  <Input 
                     label="Full Name" 
                     name="full_name" 
                     defaultValue={user.full_name || ''} 
                     required 
                  />
                  <Input 
                     label="Email" 
                     defaultValue={user.email} 
                     disabled 
                     hint="Email cannot be changed." 
                  />
               </div>
               <div className="grid sm:grid-cols-2 gap-4">
                  <Input 
                     label="Phone Number" 
                     name="phone" 
                     defaultValue={user.phone || ''} 
                     placeholder="+251 911 234 567" 
                  />
                  <Input 
                     label="Location" 
                     name="location" 
                     defaultValue={user.location || ''} 
                     placeholder="Addis Ababa, Bole" 
                  />
               </div>
            </div>
         </div>
      </Card>

      {isShopper && (
        <Card>
           <CardHeader title="Shopper Profile" subtitle="Public information displayed to buyers." />
           <div className="space-y-4">
              <Input 
                 label="Business Name (Optional)" 
                 name="business_name" 
                 defaultValue={user.shopper_profiles[0]?.business_name || ''} 
                 placeholder="Your Store Name" 
              />
              <Textarea 
                 label="Bio / About Me" 
                 name="bio" 
                 defaultValue={user.shopper_profiles[0]?.bio || ''} 
                 placeholder="Tell buyers about what you import, your experience, and your average delivery times."
                 rows={4} 
              />
           </div>
        </Card>
      )}

      <div className="flex justify-end">
         <Button type="submit" variant="primary" loading={pending} size="lg">
           Save Changes
         </Button>
      </div>
    </form>
  )
}
