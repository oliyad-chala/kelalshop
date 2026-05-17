'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { sendMessage } from '@/lib/actions/messages'
import { MessageBubble } from './MessageBubble'
import { useMessages } from '@/lib/hooks/useRealtime'
import { Button } from '@/components/ui/Button'
import type { Message } from '@/types/app.types'

interface ChatWindowProps {
  orderId: string
  currentUserId: string
  initialMessages: Message[]
  disabledReason?: string
}

const initialState = {
  error: '',
  success: '',
}

export function ChatWindow({ orderId, currentUserId, initialMessages, disabledReason }: ChatWindowProps) {
  const { messages, appendMessage } = useMessages(orderId, initialMessages)

  const [state, formAction, pending] = useActionState(sendMessage, initialState)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // On success: clear the form and optimistically append the message
  useEffect(() => {
    if (state?.success) {
      // The realtime hook will append the message via postgres_changes.
      // We just need to reset the form.
      formRef.current?.reset()
      setSelectedFile(null)
      // Re-focus the input for fast follow-up typing
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

        {/* File preview */}
        {selectedFile && (
          <div className="mb-3 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm text-blue-800">
            <div className="flex items-center gap-2 truncate">
              <svg className="w-4 h-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="truncate">{selectedFile.name}</span>
            </div>
            <button type="button" onClick={() => setSelectedFile(null)} className="text-blue-500 hover:text-blue-700 ml-3 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <form ref={formRef} action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="order_id" value={orderId} />

          <label
            className={`shrink-0 p-2 rounded-xl transition-colors ${
              disabledReason || pending
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50 cursor-pointer'
            }`}
            title={disabledReason || "Attach an image"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={!!disabledReason || pending}
            />
          </label>

          <input
            ref={inputRef}
            type="text"
            name="content"
            placeholder={disabledReason || "Type a message…"}
            className={`flex-1 min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none transition-colors ${
              disabledReason
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-50 text-navy-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:bg-white'
            }`}
            autoComplete="off"
            disabled={!!disabledReason || pending}
          />

          <Button
            type="submit"
            variant="primary"
            className="shrink-0 rounded-xl px-4 py-2.5"
            loading={pending}
            disabled={!!disabledReason || pending}
            aria-label="Send message"
          >
            {!pending && (
              <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
