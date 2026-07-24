'use client'

import { useState, useTransition } from 'react'
import { subscribeToNewsletter } from '@/lib/actions/newsletter'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('idle')
    setMessage('')

    startTransition(async () => {
      const res = await subscribeToNewsletter(email)
      if (res.error) {
        setStatus('error')
        setMessage(res.error)
      } else {
        setStatus('success')
        setMessage(res.message || 'Subscribed successfully!')
        setEmail('')
      }
    })
  }

  return (
    <div className="w-full lg:w-auto flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full sm:w-80 px-4 py-3 rounded-xl bg-navy-800/50 border border-white/10 text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
          required
          disabled={isPending}
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-600 text-navy-950 font-bold transition-all whitespace-nowrap shadow-sm flex items-center justify-center gap-2 min-w-[120px]"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <span>Subscribe</span>
          )}
        </button>
      </form>
      
      {status === 'success' && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mt-1 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
