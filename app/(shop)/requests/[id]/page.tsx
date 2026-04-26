import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatPrice, getRequestStatusColor, formatRelativeTime } from '@/lib/utils/formatters'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('requests').select('title').eq('id', id).single()
  const metadata = data as any
  return { title: metadata?.title ? `${metadata.title} | Buyer Request` : 'Request Not Found' }
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Need user to determine actions
  const { data: { user } } = await supabase.auth.getUser()
  const currentProfile = user ? await supabase.from('profiles').select('role').eq('id', user.id).single() : null
  const isShopper = currentProfile?.data?.role === 'shopper'
  
  const { data: requestResult } = await supabase
    .from('requests')
    .select('*, categories(*), profiles:buyer_id(*), shopper:shopper_id(*)')
    .eq('id', id)
    .single()

  const request = requestResult as any

  if (!request) {
    notFound()
  }

  const isOwner = user?.id === request.buyer_id
  const isAssigned = user?.id === request.shopper_id

  return (
    <main className="flex-1 bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 overflow-x-auto pb-2">
           <Link href="/" className="hover:text-navy-900 shrink-0">Home</Link>
           <span className="shrink-0">/</span>
           <Link href="/requests" className="hover:text-navy-900 shrink-0">Requests</Link>
           <span className="shrink-0">/</span>
           <span className="text-navy-900 font-medium truncate">{request.title}</span>
        </nav>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 lg:p-10">
           
           {/* Header Info */}
           <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
             <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge variant={getRequestStatusColor(request.status) as any} className="uppercase px-3 py-1 text-xs">
                     {request.status}
                  </Badge>
                  {request.categories && (
                     <Badge variant="default" className="text-slate-600 bg-slate-100 font-medium">
                        {request.categories.name}
                     </Badge>
                  )}
                  <span className="text-sm text-slate-400">
                     Posted {formatRelativeTime(request.created_at)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 leading-tight">
                  {request.title}
                </h1>
             </div>
             
             {request.budget && (
                <div className="shrink-0 md:text-right bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[160px]">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Budget</div>
                   <div className="text-2xl font-bold text-amber-600">
                      {formatPrice(request.budget)}
                   </div>
                </div>
             )}
           </div>

           {/* Layout Grid */}
           <div className="grid md:grid-cols-3 gap-10">
             
             {/* Left - Description */}
             <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-navy-900 mb-4">Details & Specifications</h3>
                <div className="prose prose-slate text-slate-600 mb-8 whitespace-pre-line font-medium leading-relaxed">
                   {request.description}
                </div>
                
                {request.source_url && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
                     <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Reference Link Provided
                     </h4>
                     <a href={request.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline text-sm break-all font-medium">
                        {request.source_url}
                     </a>
                  </div>
                )}
             </div>

             {/* Right - Profile & Actions */}
             <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Requested By</h4>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                     <Avatar src={request.profiles.avatar_url} name={request.profiles.full_name} size="md" />
                     <div>
                        <div className="font-medium text-navy-900">{request.profiles.full_name}</div>
                        <div className="text-xs text-slate-500">Buyer</div>
                     </div>
                  </div>
                </div>

                {/* Assignment Status */}
                {request.shopper && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Assigned To</h4>
                    <Link href={`/shoppers/${request.shopper.id}`} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3 hover:border-amber-400 transition-colors group">
                       <Avatar src={request.shopper.avatar_url} name={request.shopper.full_name} size="md" />
                       <div>
                          <div className="font-medium text-navy-900 group-hover:text-amber-600">{request.shopper.full_name}</div>
                          <div className="text-xs text-blue-600 font-medium">Verified Shopper</div>
                       </div>
                    </Link>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-6 border-t border-slate-100">
                  {!user ? (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-slate-500">Sign in to offer your services for this request.</p>
                      <Link href={`/auth/login?redirectTo=/requests/${id}`}>
                         <Button variant="outline" fullWidth>Sign In</Button>
                      </Link>
                    </div>
                  ) : isOwner ? (
                     <div className="space-y-3">
                        <Button variant="outline" fullWidth>Edit Request (Dashboard)</Button>
                        {request.status === 'open' && (
                           <Button variant="ghost" className="text-red-600 hover:bg-red-50" fullWidth>Cancel Request</Button>
                        )}
                     </div>
                  ) : isShopper && request.status === 'open' ? (
                     <Button variant="primary" size="lg" fullWidth>
                        Message Buyer & Create Offer
                     </Button>
                  ) : isAssigned ? (
                     <Button variant="primary" size="lg" fullWidth>
                        View Active Chat Order
                     </Button>
                  ) : (
                     <p className="text-sm text-slate-500 text-center bg-slate-50 p-4 rounded-xl">
                        This request is no longer accepting new shopper offers.
                     </p>
                  )}
                </div>
             </div>
             
           </div>
        </div>
      </div>
    </main>
  )
}
