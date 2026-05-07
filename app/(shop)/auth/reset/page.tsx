'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/actions/auth'
import type { Metadata } from 'next'

const initialState = { error: '', success: '' }

function ResetForm() {
  const [state, formAction, pending] = useActionState(resetPassword, initialState)

  if (state?.success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
        </div>
        <p className="text-green-700 font-semibold text-lg">Email sent!</p>
        <p className="text-slate-500 text-sm">{state.success}</p>
        <Link
          href="/auth/login"
          className="inline-block mt-4 text-sm font-medium text-amber-500 hover:text-amber-600"
        >
          ← Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 fade-in">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-700">{state.error}</div>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-navy-900">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? 'Sending...' : 'Send Reset Link'}
      </button>

      <p className="text-center text-sm text-slate-500">
        Remember your password?{' '}
        <Link href="/auth/login" className="font-medium text-amber-500 hover:text-amber-600">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center p-4 bg-slate-50 relative overflow-hidden min-h-screen">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[100px] opacity-50" />

      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/auth/login"
          className="flex items-center gap-2 text-slate-600 hover:text-navy-900 transition-colors bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-slate-200/50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium text-sm">Back to Sign In</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative z-10 fade-in border border-slate-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold tracking-tight text-navy-900">
              Kelal<span className="text-amber-500">Shop</span>
            </span>
          </Link>
          <h1 className="text-2xl font-semibold text-navy-900 tracking-tight">
            Reset your password
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <ResetForm />
      </div>
    </main>
  )
}
