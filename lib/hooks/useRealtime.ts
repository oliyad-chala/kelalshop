'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/app.types'

/**
 * Subscribes to new messages for an order via Supabase Realtime.
 *
 * Instead of calling router.refresh() (which causes a full server re-render
 * flash), we maintain local state and append new messages directly.
 *
 * Returns:
 *  - messages: the live list of messages
 *  - appendMessage: call this after a successful optimistic send so the
 *    sender sees their own message immediately without waiting for realtime
 */
export function useMessages(orderId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  // When the server re-renders and passes new initialMessages (e.g. after
  // router.refresh or navigation), sync local state.
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  const appendMessage = useCallback((msg: Message) => {
    setMessages(prev => {
      // Avoid duplicates (realtime may also fire for the sender's own message)
      if (prev.some(m => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  useEffect(() => {
    if (!orderId) return

    const supabase = createClient()

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
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  return { messages, appendMessage }
}

/**
 * Subscribes to direct messages (no order) between the current user and a partner.
 * Listens for new messages where the current user is the recipient.
 */
export function useDirectMessages(
  partnerId: string,
  currentUserId: string,
  initialMessages: Message[]
) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    if (!partnerId || !currentUserId) return

    const supabase = createClient()

    // Subscribe to messages sent TO the current user (by the partner)
    const channel = supabase
      .channel(`dm_${[partnerId, currentUserId].sort().join('_')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          // Only append if it's from this specific DM partner
          if (newMsg.sender_id !== partnerId) return
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partnerId, currentUserId])

  return { messages }
}
