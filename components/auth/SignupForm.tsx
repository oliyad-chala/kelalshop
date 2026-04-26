'use client'

import { useActionState, useState } from 'react'
import { clsx } from 'clsx'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const initialState = {
  error: '',
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState)
  const [role, setRole] = useState<'buyer' | 'shopper'>('buyer')

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 fade-in">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-700">{state.error}</div>
        </div>
      )}

      {/* Google SSO Button Mock */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-navy-900 font-medium hover:bg-slate-50 transition-colors shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign up with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or continue with email</span>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          label="Full Name"
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          placeholder="Abebe Kebede"
        />

        <Input
          label="Phone Number"
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+251 911 234 567"
        />

        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Min. 8 characters"
          hint="Use a mix of letters, numbers, and symbols."
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-navy-900">
          How do you want to use KelalShop?
        </label>
        
        <input type="hidden" name="role" value={role} />
        
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={clsx(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
              role === 'buyer'
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            )}
          >
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center",
              role === 'buyer' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
            )}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="font-medium">I want to buy</div>
            <div className="text-xs opacity-80">Order products & request items</div>
          </button>

          <button
            type="button"
            onClick={() => setRole('shopper')}
            className={clsx(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
              role === 'shopper'
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            )}
          >
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center",
              role === 'shopper' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
            )}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-medium">I want to sell</div>
            <div className="text-xs opacity-80">List products & fulfill requests</div>
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
      >
        Create Account
      </Button>
    </form>
  )
}
