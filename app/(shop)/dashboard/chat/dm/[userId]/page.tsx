import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { DirectChatWindow } from '@/components/chat/DirectChatWindow'
import { markDirectMessagesRead } from '@/lib/actions/messages'

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: partner } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()
  return { title: partner?.full_name ? `Chat with ${partner.full_name} | KelalShop` : 'Direct Message | KelalShop' }
}

export default async function DirectMessagePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Can't DM yourself
  if (userId === user.id) redirect('/dashboard/chat')

  // Fetch the partner's profile
  const { data: partner } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .eq('id', userId)
    .single()

  if (!partner) notFound()

  // Fetch all direct messages between these two users (no order_id)
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .is('order_id', null)
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })

  // Mark received messages as read (safe to call here — not a revalidatePath call)
  await markDirectMessagesRead(userId)

  const roleLabel = partner.role === 'shopper' ? 'Shopper' : partner.role === 'admin' ? 'Admin' : 'Buyer'

  return (
    <div className="max-w-4xl flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100vh-8rem)] fade-in">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <Link
          href="/dashboard/chat"
          className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-navy-900 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <Avatar src={partner.avatar_url} name={partner.full_name} size="md" />

        <div className="flex-1 min-w-0">
          <div className="font-bold text-navy-900 truncate">{partner.full_name}</div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">{roleLabel}</span>
            {partner.role === 'shopper' && (
              <Badge variant="amber" size="sm">Verified Shopper</Badge>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1 text-xs text-slate-400">
          <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="6" />
          </svg>
          Direct Message
        </div>
      </div>

      {/* DM Chat Interface */}
      <DirectChatWindow
        recipientId={userId}
        currentUserId={user.id}
        initialMessages={messages || []}
      />
    </div>
  )
}
