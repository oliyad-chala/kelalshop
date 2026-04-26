'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface RealtimeListenerProps {
  userId: string
}

export function RealtimeListener({ userId }: RealtimeListenerProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Listen to any order updates where the user is involved (as buyer or shopper)
    const channel = supabase
      .channel(`user_dashboard_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Whenever an order changes, refresh the route to update UI natively
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Whenever a new message arrives for this user, refresh the route
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, router, supabase])

  return null // Silent component, purely for side-effects
}
