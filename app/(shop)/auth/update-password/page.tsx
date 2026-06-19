'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { confirmPasswordWithOtp } from '@/lib/actions/auth'
import { useRouter, useSearchParams } from 'next/navigation'

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const otp = searchParams.get('otp') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !otp) {
      setError('Missing verification details. Please start the reset process again.')
      return
    }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('email', email)
    formData.append('otp', otp)
    formData.append('password', password)
    formData.append('confirm_password', confirm)

    const result = await confirmPasswordWithOtp({ error: '', success: '' }, formData)

    if (result.error) {
      setLoading(false)
      setError(result.error)
      return
    }

    setLoading(false)
    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 2500)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-700 font-semibold text-lg">Password updated!</p>
        <p className="text-slate-500 text-sm">Redirecting you to login…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 fade-in">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="new-password" className="block text-sm font-medium text-navy-900">New Password</label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          placeholder="Min. 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirm-password" className="block text-sm font-medium text-navy-900">Confirm Password</label>
        <input
          id="confirm-password"
          type="password"
          required
          placeholder="Re-enter password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
        {mismatch && <p className="text-xs text-red-500">Passwords do not match.</p>}
      </div>

      <button
        type="submit"
        disabled={loading || mismatch}
        className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  )
}

export default function UpdatePasswordPage() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center p-4 bg-slate-50 relative overflow-hidden min-h-screen">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[100px] opacity-50" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative z-10 fade-in border border-slate-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold tracking-tight text-navy-900">
              Kelal<span className="text-amber-500">Shop</span>
            </span>
          </Link>
          <h1 className="text-2xl font-semibold text-navy-900 tracking-tight">
            Set new password
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Choose a strong password for your account.
          </p>
        </div>

        <Suspense fallback={<div className="h-48 animate-pulse bg-slate-100 rounded-xl" />}>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </main>
  )
}
