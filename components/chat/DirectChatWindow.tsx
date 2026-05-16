'use client'

import { useActionState, useEffect, useRef } from 'react'
import { sendDirectMessage } from '@/lib/actions/messages'
import { MessageBubble } from './MessageBubble'
import { useDirectMessages } from '@/lib/hooks/useRealtime'
import { Button } from '@/components/ui/Button'
import type { Message } from '@/types/app.types'

interface DirectChatWindowProps {
  recipientId: string
  currentUserId: string
  initialMessages: Message[]
}

const initialState = { error: '', success: '' }

export function DirectChatWindow({ recipientId, currentUserId, initialMessages }: DirectChatWindowProps) {
  const { messages } = useDirectMessages(recipientId, currentUserId, initialMessages)

  const [state, formAction, pending] = useActionState(sendDirectMessage, initialState)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear form on success
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      inputRef.current?.focus()
    }
  }, [state])

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-medium">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg: Message) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              imageUrl={msg.image_url}
              timestamp={msg.created_at}
              isOwn={msg.sender_id === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-3 sm:p-4 bg-white border-t border-slate-200">
        <form ref={formRef} action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="recipient_id" value={recipientId} />

          <input
            ref={inputRef}
            type="text"
            name="content"
            placeholder="Type a message…"
            className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:bg-white transition-colors"
            autoComplete="off"
            disabled={pending}
          />

          <Button
            type="submit"
            variant="primary"
            className="shrink-0 rounded-xl px-4 py-2.5"
            loading={pending}
            aria-label="Send message"
          >
            {!pending && (
              <svg className="w-5 h-5 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </form>

        {state?.error && (
          <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {state.error}
          </p>
        )}
      </div>
    </div>
  )
}
