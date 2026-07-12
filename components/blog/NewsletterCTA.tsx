'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'

interface NewsletterCTAProps {
  title?: string
  description?: string
}

export default function NewsletterCTA({
  title = "Get the Latest Ethiopian E-Commerce Tips",
  description = "Subscribe to the KelalShop newsletter for weekly shopping guides, importer tips, and exclusive deals delivered to your inbox."
}: NewsletterCTAProps) {
  const [email, setEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setSubscribeStatus('loading')
    try {
      // Simulate API network call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Store in localStorage for client persistence demo
      const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]')
      if (!subscribers.includes(email)) {
        subscribers.push(email)
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers))
      }

      setSubscribeStatus('success')
      setMessage("Thank you! You've successfully subscribed to our newsletter.")
      setEmail('')
    } catch {
      setSubscribeStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-navy-950 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-lg border border-white/5">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[-50%] left-[-20%] w-[60%] h-[200%] bg-amber-400 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl mb-4 border border-amber-500/20">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {title}
        </h3>
        <p className="text-navy-300 mb-8 text-sm sm:text-base max-w-lg mx-auto">
          {description}
        </p>

        {subscribeStatus === 'success' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-6 max-w-md mx-auto animate-scaleUp">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="font-bold text-white text-lg mb-1">Subscribed Successfully!</h4>
            <p className="text-sm text-emerald-300">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1 relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                required
                disabled={subscribeStatus === 'loading'}
              />
            </div>
            <button
              type="submit"
              disabled={subscribeStatus === 'loading'}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/10"
            >
              {subscribeStatus === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                'Subscribe'
              )}
            </button>
          </form>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-navy-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero spam. Unsubscribe anytime.</span>
        </div>
      </div>
    </div>
  )
}
