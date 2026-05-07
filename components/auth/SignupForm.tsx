'use client'

import { useActionState, useState } from 'react'
import { clsx } from 'clsx'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const initialState = { error: '' }

// Eye icons for password toggle
function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState)
  const [role, setRole] = useState<'buyer' | 'shopper'>('buyer')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [nameError, setNameError] = useState('')

  const confirmMismatch = confirm.length > 0 && password !== confirm

  // Name must not contain digits
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (/\d/.test(val)) {
      setNameError('Name must not contain numbers.')
    } else {
      setNameError('')
    }
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

      <div className="space-y-4">
        {/* Full Name — letters only */}
        <div>
          <Input
            label="Full Name"
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            placeholder="Abebe Kebede"
            pattern="^[^0-9]*$"
            title="Name must not contain numbers"
            onChange={handleNameChange}
            error={nameError}
          />
        </div>

        {/* Phone — required */}
        <Input
          label="Phone Number"
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          placeholder="+251 911 234 567"
          pattern="^\+?[0-9\s\-\(\)]{7,20}$"
          title="Enter a valid phone number"
        />

        {/* Email */}
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />

        {/* Password */}
        <div>
          <Input
            label="Password"
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            placeholder="Min. 8 characters"
            hint="Use a mix of letters, numbers, and symbols."
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />
        </div>

        {/* Confirm Password */}
        <div>
          <Input
            label="Confirm Password"
            id="confirm_password"
            name="confirm_password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
            error={confirmMismatch ? 'Passwords do not match.' : undefined}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />
        </div>
      </div>

      {/* Role selector */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-navy-900">
          How do you want to use KelalShop?
        </label>
        <input type="hidden" name="role" value={role} />
        <div className="grid grid-cols-2 gap-3">
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
            <div className="font-semibold text-sm">I want to buy</div>
            <div className="text-xs opacity-75">Order products &amp; request items</div>
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
            <div className="font-semibold text-sm">I want to sell</div>
            <div className="text-xs opacity-75">List products &amp; fulfill requests</div>
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
        disabled={confirmMismatch || !!nameError}
      >
        Create Account
      </Button>
    </form>
  )
}

