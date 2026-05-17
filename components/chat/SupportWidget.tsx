'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  content: string
  sender_type: 'user' | 'bot' | 'admin'
  created_at: string
  isTyping?: boolean
}

const QUICK_REPLIES = [
  "How do I buy a product?",
  "How do I become a verified shopper?",
  "What payment methods do you accept?",
]

// Renders bot message with bold (**text**) and bullet points (* item)
function BotMessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('* ') || line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-amber-500 font-bold shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatBold(line.slice(2)) }} />
            </div>
          )
        }
        return line ? (
          <p key={i} dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
        ) : <br key={i} />
      })}
    </div>
  )
}

function formatBold(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

// Typewriter hook
function useTypewriter(text: string, speed = 18, enabled = true) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!enabled) { setDisplayed(text); setDone(true); return }
    setDisplayed('')
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        setDone(true)
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, enabled])
  return { displayed, done }
}

function TypingBotMessage({ content, isNew }: { content: string; isNew: boolean }) {
  const { displayed } = useTypewriter(content, 12, isNew)
  return <BotMessageContent content={displayed} />
}

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [guestId, setGuestId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [newestBotId, setNewestBotId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Init guest ID + attention hint
  useEffect(() => {
    let id = localStorage.getItem('kelal_support_guest_id')
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('kelal_support_guest_id', id) }
    setGuestId(id)
    // Show "Hi! Need help?" hint after 4s
    const t = setTimeout(() => setShowHint(true), 4000)
    return () => clearTimeout(t)
  }, [])

  // Auto scroll
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    setShowHint(false)
    const messageContent = text.trim()
    setInput('')
    setIsLoading(true)

    const userMsg: Message = {
      id: crypto.randomUUID(),
      content: messageContent,
      sender_type: 'user',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent, sessionId, guestId, userId: user?.id || null })
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        console.error('Chat API failed:', data.error || data.details)
        return
      }

      if (data.sessionId && !sessionId) setSessionId(data.sessionId)

      if (data.reply) {
        const botId = crypto.randomUUID()
        const botMsg: Message = {
          id: botId,
          content: data.reply,
          sender_type: 'bot',
          created_at: new Date().toISOString()
        }
        setNewestBotId(botId)
        setMessages(prev => [...prev, botMsg])
      }
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input) }

  return (
    <>
      {/* Hint bubble */}
      {showHint && !isOpen && (
        <div
          onClick={() => { setIsOpen(true); setShowHint(false) }}
          className="fixed bottom-24 right-6 z-50 cursor-pointer"
          style={{ animation: 'slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
        >
          <div className="bg-white rounded-2xl rounded-br-sm shadow-xl border border-slate-100 px-4 py-3 text-sm font-medium text-navy-900 whitespace-nowrap flex items-center gap-2">
            <span>👋</span> Hi! Need help?
            <div className="absolute -bottom-1 right-3 w-2 h-2 bg-white border-r border-b border-slate-100 rotate-45" />
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => { setIsOpen(o => !o); setShowHint(false) }}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg focus:outline-none transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          boxShadow: isOpen ? '0 4px 20px rgba(245,158,11,0.5)' : '0 4px 20px rgba(245,158,11,0.4)',
          transform: isOpen ? 'scale(1.05)' : 'scale(1)'
        }}
        aria-label="Open support chat"
      >
        {/* Pulse rings */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-amber-400 opacity-30" style={{ animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }} />
            <span className="absolute inset-0 rounded-full bg-amber-400 opacity-20" style={{ animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite', animationDelay: '0.5s' }} />
          </>
        )}
        <span style={{ display: 'inline-block', transition: 'transform 0.3s, opacity 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          {isOpen ? (
            <svg className="w-6 h-6 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </span>
      </button>

      {/* Chat Window — floating panel on both mobile and desktop */}
      {isOpen && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200/60"
          style={{
            bottom: '88px',
            right: '16px',
            width: 'min(calc(100vw - 32px), 370px)',
            height: 'min(calc(100dvh - 120px), 520px)',
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(26,31,54,0.22), 0 4px 16px rgba(26,31,54,0.12)',
            animation: 'chatSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards'
          }}
        >
          {/* Header */}
          <div
            className="shrink-0 px-5 py-4 flex items-center gap-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a1f36 0%, #2d3470 100%)' }}
          >
            {/* Subtle background glow */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-4 right-8 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative shrink-0">
              {/* Avatar with AI bot icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f97316 100%)' }}
              >
                {/* Sparkle / AI icon */}
                <svg className="w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z"/>
                </svg>
              </div>
              {/* Online dot */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 rounded-full"
                style={{ borderColor: '#1a1f36', animation: 'pulse 2s ease-in-out infinite' }}
              />
            </div>
            <div className="flex-1 min-w-0 relative">
              <h3 className="text-white font-extrabold leading-tight tracking-tight text-base">Kelal Support</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                <p className="text-emerald-300 text-xs font-medium">AI Assistant • Online now</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white/90 transition-colors ml-auto shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8fafc' }}>
            {messages.length === 0 ? (
              <div
                className="h-full flex flex-col items-center justify-center text-center px-4 gap-4"
                style={{ animation: 'fadeIn 0.4s ease forwards' }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  K
                </div>
                <div>
                  <p className="font-bold text-navy-900 text-lg mb-1">Hi there! 👋</p>
                  <p className="text-slate-500 text-sm leading-relaxed">I'm your KelalShop AI assistant.<br />How can I help you today?</p>
                </div>
                {/* Quick reply chips */}
                <div className="flex flex-col gap-2 w-full mt-2">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-navy-900 font-medium hover:border-amber-400 hover:bg-amber-50 transition-all shadow-sm hover:shadow-md"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{
                    animation: `${msg.sender_type === 'user' ? 'slideInRight' : 'slideInLeft'} 0.3s cubic-bezier(0.34,1.2,0.64,1) forwards`,
                    animationDelay: `${Math.min(idx * 0, 0)}ms`
                  }}
                >
                  {msg.sender_type !== 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-auto mb-1 shadow-sm">
                      K
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.sender_type === 'user'
                        ? 'bg-gradient-to-br from-amber-500 to-amber-400 text-navy-950 rounded-br-sm font-medium'
                        : 'bg-white text-navy-900 rounded-bl-sm border border-slate-100'
                    }`}
                  >
                    {msg.sender_type === 'bot' ? (
                      <TypingBotMessage content={msg.content} isNew={msg.id === newestBotId} />
                    ) : (
                      msg.content
                    )}
                    <div className={`text-[10px] mt-1.5 ${msg.sender_type === 'user' ? 'text-amber-800/60 text-right' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2 items-end" style={{ animation: 'slideInLeft 0.3s ease forwards' }}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                  K
                </div>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map(delay => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-slate-400 rounded-full"
                        style={{ animation: 'typingBounce 1s ease-in-out infinite', animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 p-3 bg-white border-t border-slate-100">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1a1f36, #364086)' }}
              >
                <svg className="w-4 h-4 text-white ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            <p className="text-center text-[10px] text-slate-300 mt-2 font-medium tracking-wide">Powered by Kelal AI ✨</p>
          </div>
        </div>
      )}
    </>
  )
}
