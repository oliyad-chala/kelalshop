import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { submitVerification } from '@/lib/actions/verification'

export const metadata = {
  title: 'Identity Verification | KelalShop',
}

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Ensure user is a shopper
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, shopper_profiles(verification_status)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'shopper') {
    redirect('/dashboard')
  }

  const status = profile.shopper_profiles[0]?.verification_status || 'unverified'

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
           <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Identity Verification</h1>
           <Badge 
              variant={
                 status === 'verified' ? 'success' : 
                 status === 'pending' ? 'warning' : 
                 status === 'rejected' ? 'danger' : 'default'
              }
              className="mt-1"
           >
              {status}
           </Badge>
        </div>
        <p className="text-slate-500 mt-1">
          Verify your identity to unlock features like receiving orders and contacting buyers.
        </p>
      </div>

      <Card>
         {status === 'verified' ? (
            <div className="text-center py-12">
               <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4 border border-green-100">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
               </div>
               <h3 className="text-lg font-bold text-navy-900 mb-2">You are officially verified!</h3>
               <p className="text-slate-500">Your identity has been confirmed. You have full access to shopper features.</p>
            </div>
         ) : status === 'pending' ? (
            <div className="text-center py-12">
               <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4 border border-amber-100">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
               </div>
               <h3 className="text-lg font-bold text-navy-900 mb-2">Review in Progress</h3>
               <p className="text-slate-500">Your documents have been submitted and are currently being reviewed by our team. This usually takes 1-2 business days.</p>
            </div>
         ) : (
            <form action={submitVerification} className="space-y-6">
               <CardHeader 
                 title="Upload Kebele ID / Passport" 
                 subtitle="Please provide a clear scan or photo of your valid government-issued ID." 
               />
               
               {status === 'rejected' && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium mb-6 flex gap-3">
                     <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     Your previous submission was rejected. Please ensure the document is clear, readable, and valid.
                  </div>
               )}

               <div className="w-full h-48 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl flex flex-col items-center justify-center relative hover:bg-slate-100 transition-colors group">
                  <svg className="w-10 h-10 text-slate-300 mb-3 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm font-medium text-navy-900 mb-1">Click to browse file</span>
                  <span className="text-xs text-slate-500">JPG, PNG or PDF (Max 5MB)</span>
                  
                  <input 
                     type="file" 
                     name="id_document" 
                     accept="image/*,.pdf" 
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     required
                  />
               </div>

               <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                     We use industry-standard encryption to protect your data. Your ID will only be used for verification purposes and will never be shared publicly.
                  </div>
               </div>

               <div className="flex justify-end pt-4">
                 {/* Uses useActionState behind the scenes or standard submit button handling */}
                 <Button type="submit" variant="primary" size="lg">Submit for Verification</Button>
               </div>
            </form>
         )}
      </Card>
    </div>
  )
}
