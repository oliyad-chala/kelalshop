import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/app.types'

export function useMessages(orderId: string, initialMessages: Message[]) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!orderId) return

    const channel = supabase
      .channel(`order_messages_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          // Instead of managing state client-side, we just trigger a Next.js server refresh
          // so server components/actions update with new data naturally.
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, router, supabase])

  return initialMessages
}
