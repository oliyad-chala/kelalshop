import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RequestCard } from '@/components/requests/RequestCard'
import type { RequestWithDetails } from '@/types/app.types'

export const metadata = {
  title: 'Requests | KelalShop',
}

export default async function DashboardRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isShopper = profile?.role === 'shopper'

  // If buyer, fetch THEIR requests. If shopper, fetch requested assigned to them + open requests matching categories?
  // For simplicity, buyers see their created requests. Shoppers see all 'open' requests to bid on.
  let query = supabase.from('requests').select('*, categories(*), profiles:buyer_id(*), shopper:shopper_id(*)')
  
  if (isShopper) {
    query = query.or(`status.eq.open,shopper_id.eq.${user.id}`)
  } else {
    query = query.eq('buyer_id', user.id)
  }

  const { data: requests } = await query.order('created_at', { ascending: false })

  const items = requests as RequestWithDetails[] | null

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
             {isShopper ? 'Buyer Requests' : 'My Requests'}
          </h1>
          <p className="text-slate-500 mt-1">
             {isShopper ? 'Find open requests from buyers and offer to import them.' : 'Track the items you want shoppers to find for you.'}
          </p>
        </div>
        {!isShopper && (
          <Link href="/dashboard/requests/new">
            <Button variant="primary">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </Button>
          </Link>
        )}
      </div>

      {!items || items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">No requests found</h3>
          <p className="text-slate-500 max-w-md mb-6">
            {isShopper ? 'There are no open requests from buyers right now.' : 'You haven\'t posted any requests yet.'}
          </p>
          {!isShopper && (
            <Link href="/dashboard/requests/new">
              <Button variant="primary">Create Request</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((request) => (
            <RequestCard 
               key={request.id} 
               request={request} 
               view={isShopper ? 'shopper' : 'buyer'} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
