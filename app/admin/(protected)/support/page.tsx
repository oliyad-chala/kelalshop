import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { Headphones } from 'lucide-react'
import { getSupportInbox } from '@/app/admin/(protected)/notifications/actions'
import SupportInboxClient from '@/app/admin/(protected)/notifications/SupportInboxClient'

export const metadata = { title: 'Support Desk | KelalShop Admin' }

export default async function SupportDeskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) redirect('/admin/dashboard')

  const inboxRes = await getSupportInbox()
  const initialConversations = 'conversations' in inboxRes ? inboxRes.conversations : []

  return (
    <div className="fade-in support-page-shell">
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Headphones size={24} color="var(--color-primary)" />
            Support Desk Center
          </h1>
          <p className="section-subtitle">
            Manage incoming customer inquiries, buyer tickets, and direct chat responses.
          </p>
        </div>
      </div>

      {/* SUPPORT INBOX DESK */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <SupportInboxClient 
          initialConversations={initialConversations as any}
          adminUserId={user.id}
        />
      </div>
    </div>
  )
}
