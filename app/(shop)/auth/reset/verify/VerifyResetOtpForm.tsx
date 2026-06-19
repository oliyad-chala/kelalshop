'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verifyPasswordResetOtp, resetPassword } from '@/lib/actions/auth'

export default function VerifyResetOtpForm({ email }: { email: string }) {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [cooldown, setCooldown] = useState(0)
  
  const maskEmail = (emailStr: string) => {
    const [name, domain] = emailStr.split('@')
    if (!name || !domain) return emailStr
    if (name.length <= 2) return `${name[0]}***@${domain}`
    return `${name[0]}${name.slice(1, 3)}***@${domain}`
  }

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter a 6-digit verification code.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await verifyPasswordResetOtp(email, otp)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Verification successful! Redirecting...')
        setTimeout(() => {
          router.push(`/auth/update-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`)
        }, 1500)
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('email', email)
      const result = await resetPassword({ error: '', success: '' }, formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Verification code resent successfully.')
        setCooldown(60)
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
        <h3 className="text-sm font-semibold text-navy-900 mb-1">Check Your Inbox</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          We sent a 6-digit password reset code to <strong className="text-navy-900">{maskEmail(email)}</strong>. 
          Please enter the code to verify your request.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 text-left">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-start gap-3 text-left">
          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-1 text-left">
          <label htmlFor="otp-input" className="block text-sm font-medium text-navy-900">
            Reset Code
          </label>
          <input
            id="otp-input"
            type="text"
            required
            maxLength={6}
            pattern="\d{6}"
            placeholder="e.g. 123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={loading || error.includes('locked')}
            className="w-full text-center tracking-[12px] font-mono text-2xl px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6 || error.includes('locked')}
          className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
      </form>

      <div className="flex justify-between items-center text-sm pt-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || cooldown > 0 || error.includes('locked')}
          className="text-amber-600 hover:text-amber-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="text-slate-500 hover:text-slate-700 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
