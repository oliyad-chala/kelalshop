'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { MessageSquare, X, ArrowRight, Volume2, VolumeX } from 'lucide-react'

interface ToastMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string | null
  content: string
  href: string
  createdAt: string
}

interface RealtimeChatNotificationProps {
  userId: string
}

/**
 * Plays a modern, subtle two-tone audio chime using the Web Audio API.
 * Requires no external audio assets and operates natively in the browser.
 */
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12) // A5

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(880, now + 0.08)
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22) // D6

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.25)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.35)
  } catch {
    // Silently fall back if audio context is blocked by browser autoplay policy
  }
}

export function RealtimeChatNotification({ userId }: RealtimeChatNotificationProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const activeTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = activeTimeouts.current.get(id)
    if (timer) {
      clearTimeout(timer)
      activeTimeouts.current.delete(id)
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    const channelName = `realtime_notifications_${userId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any
          if (!newMsg || !newMsg.sender_id) return

          // Fetch sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single()

          const senderName = sender?.full_name || 'Someone'
          const senderAvatar = sender?.avatar_url || null
          const href = newMsg.order_id
            ? `/dashboard/chat/${newMsg.order_id}`
            : `/dashboard/chat/dm/${newMsg.sender_id}`

          const toastId = `${newMsg.id}_${Date.now()}`
          const toastItem: ToastMessage = {
            id: toastId,
            senderId: newMsg.sender_id,
            senderName,
            senderAvatar,
            content: newMsg.content || 'Sent an attachment',
            href,
            createdAt: newMsg.created_at || new Date().toISOString(),
          }

          if (soundEnabled) {
            playNotificationChime()
          }

          setToasts((prev) => [toastItem, ...prev.slice(0, 3)]) // keep max 4 toasts

          // Auto-dismiss after 7 seconds
          const timer = setTimeout(() => {
            removeToast(toastId)
          }, 7000)
          activeTimeouts.current.set(toastId, timer)

          // Refresh router so unread badges in sidebar update
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      activeTimeouts.current.forEach((t) => clearTimeout(t))
      activeTimeouts.current.clear()
    }
  }, [userId, soundEnabled, router, supabase, removeToast])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {/* Sound toggle header if multiple notifications */}
      <div className="flex items-center justify-end pointer-events-auto">
        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
          className="text-xs text-slate-500 hover:text-navy-900 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          {soundEnabled ? <Volume2 size={13} className="text-amber-600" /> : <VolumeX size={13} className="text-slate-400" />}
          <span className="text-[11px] font-medium">{soundEnabled ? 'Sound on' : 'Muted'}</span>
        </button>
      </div>

      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200/80 p-4 shadow-xl shadow-amber-900/10 transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-5"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 mt-0.5">
              <Avatar
                src={toast.senderAvatar}
                name={toast.senderName}
                size="md"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={11} />
                  New Message
                </span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs font-bold text-navy-900 truncate">
                {toast.senderName}
              </p>

              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                {toast.content}
              </p>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">Just now</span>
                <Link
                  href={toast.href}
                  onClick={() => removeToast(toast.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg transition-colors"
                >
                  Reply
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
