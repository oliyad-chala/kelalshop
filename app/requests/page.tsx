import { createClient } from '@/lib/supabase/server'
import { RequestCard } from '@/components/requests/RequestCard'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import type { RequestWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'Buyer Requests | KelalShop',
}

export default async function RequestsFeedPage() {
  const supabase = await createClient()

  // Fetch all open requests, descending order
  const { data: requests } = await supabase
    .from('requests')
    .select('*, categories(*), profiles:buyer_id(*)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const items = requests as RequestWithDetails[] | null

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-12">
         <div className="max-w-2xl">
           <h1 className="text-3xl font-bold text-navy-900 tracking-tight mb-4">Buyer Requests</h1>
           <p className="text-lg text-slate-500 leading-relaxed">
             Looking for something specific? Post a request and let shoppers come to you with quotes and delivery times.
           </p>
         </div>
         <Link href="/requests/new" className="shrink-0 mt-2 sm:mt-0">
            <Button variant="primary" size="lg">Post a Request</Button>
         </Link>
      </div>

      {!items || items.length === 0 ? (
         <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
            <h3 className="text-lg font-medium text-navy-900 mb-1">No open requests</h3>
            <p className="text-slate-500">Be the first to post a new buyer request!</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(request => (
               <RequestCard key={request.id} request={request} view="shopper" /> 
               // Defaulting to shopper view format for the public board (shows who requested it)
            ))}
         </div>
      )}
    </main>
  )
}
