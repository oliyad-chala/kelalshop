'use client'

import { useActionState } from 'react'
import { Send } from 'lucide-react'
import { submitSupportMessage } from '@/lib/actions/support'
import { useRouter } from 'next/navigation'

interface ContactFormProps {
  isLoggedIn: boolean
}

export function ContactForm({ isLoggedIn }: ContactFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(submitSupportMessage, null)

  const handleUnauthenticatedClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault()
      router.push('/auth/signup?redirectTo=/contact')
    }
  }

  if (state?.success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 sm:p-10 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-900 mb-2">Message Sent!</h2>
        <p className="text-emerald-700">
          Thank you for reaching out. Our support team has received your message and will get back to you shortly.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 font-semibold text-emerald-600 hover:text-emerald-700 underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 sm:p-10">
      <h2 className="text-2xl font-bold text-navy-900 mb-6">Send us a Message</h2>
      
      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="first_name" className="text-sm font-semibold text-navy-900">First Name</label>
            <input 
              type="text" 
              id="first_name" 
              name="first_name"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all bg-slate-50 focus:bg-white" 
              placeholder="John"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="last_name" className="text-sm font-semibold text-navy-900">Last Name</label>
            <input 
              type="text" 
              id="last_name" 
              name="last_name"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all bg-slate-50 focus:bg-white" 
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-navy-900">Email Address</label>
          <input 
            type="email" 
            id="email" 
            name="email"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all bg-slate-50 focus:bg-white" 
            placeholder="john@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-semibold text-navy-900">Subject</label>
          <select 
            id="subject" 
            name="subject"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all bg-slate-50 focus:bg-white appearance-none"
          >
            <option>General Inquiry</option>
            <option>Order Support</option>
            <option>Become a Seller</option>
            <option>Technical Issue</option>
            <option>Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-semibold text-navy-900">Message</label>
          <textarea 
            id="message" 
            name="message"
            rows={5} 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all bg-slate-50 focus:bg-white resize-none" 
            placeholder="How can we help you today?"
            required
          ></textarea>
        </div>

        <button 
          type="submit" 
          onClick={handleUnauthenticatedClick}
          disabled={isPending}
          className={`w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Send className="w-5 h-5" />
          )}
          {isPending ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
