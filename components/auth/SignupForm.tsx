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
