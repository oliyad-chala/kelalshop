'use client'

import { useActionState, useState } from 'react'
import { clsx } from 'clsx'
import { signUp, signInWithGoogle } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const initialState = { error: '' }

// ── Icons ────────────────────────────────────────────────────────────────────

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

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Password strength ─────────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3 | 4

function getStrength(pwd: string): StrengthLevel {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return Math.min(4, score) as StrengthLevel
}

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
}

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  0: 'bg-slate-200',
  1: 'bg-red-400',
  2: 'bg-amber-400',
  3: 'bg-blue-400',
  4: 'bg-green-500',
}

const STRENGTH_TEXT: Record<StrengthLevel, string> = {
  0: 'text-slate-400',
  1: 'text-red-500',
  2: 'text-amber-500',
  3: 'text-blue-500',
  4: 'text-green-600',
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getStrength(password)
  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {([1, 2, 3, 4] as StrengthLevel[]).map((level) => (
          <div
            key={level}
            className={clsx(
              'h-1 flex-1 rounded-full transition-all duration-300',
              strength >= level ? STRENGTH_COLORS[strength] : 'bg-slate-200'
            )}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={clsx('text-xs font-medium', STRENGTH_TEXT[strength])}>
          {STRENGTH_LABELS[strength]} password
          {strength < 3 && ' — add uppercase, numbers or symbols'}
        </p>
      )}
    </div>
  )
}

// ── Email confirmation success screen ─────────────────────────────────────────

function ConfirmEmailScreen() {
  return (
    <div className="text-center space-y-4 py-2 fade-in">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100">
        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
        </svg>
      </div>
      <p className="text-navy-900 font-semibold text-lg">Check your inbox</p>
      <p className="text-slate-500 text-sm leading-relaxed">
        We sent a confirmation link to your email address. Click the link to activate your account and sign in.
      </p>
      <p className="text-xs text-slate-400 pt-1">
        Didn&apos;t receive it? Check your spam folder.
      </p>
      <a
        href="/auth/login"
        className="inline-block mt-2 text-sm font-medium text-amber-500 hover:text-amber-600 transition-colors"
      >
        ← Back to Sign In
      </a>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState)
  const [role, setRole] = useState<'buyer' | 'shopper'>('buyer')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [nameError, setNameError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')

  const confirmMismatch = confirm.length > 0 && password !== confirm

  // Show success screen when email confirmation is needed
  if (state?.success === 'confirm-email') {
    return <ConfirmEmailScreen />
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (/\d/.test(val)) {
      setNameError('Name must not contain numbers.')
    } else {
      setNameError('')
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setGoogleError('')
    try {
      const result = await signInWithGoogle('/dashboard')
      if ('error' in result) {
        setGoogleError(result.error)
        setGoogleLoading(false)
      } else {
        window.location.href = result.url
      }
    } catch {
      setGoogleError('Something went wrong. Please try again.')
      setGoogleLoading(false)
    }
  }

  const displayError = state?.error || googleError

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {displayError && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 fade-in">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-700">{displayError}</div>
        </div>
      )}

      {/* Google Sign-Up */}
      <button
        id="google-signup-btn"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || pending}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <svg className="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? 'Redirecting…' : 'Sign up with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or sign up with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Email form */}
      <form action={formAction} className="space-y-4">
        {/* Full Name */}
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

        {/* Phone */}
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

        {/* Password + strength meter */}
        <div>
          <Input
            label="Password"
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            placeholder="Min. 8 characters"
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
          <PasswordStrengthMeter password={password} />
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
          disabled={confirmMismatch || !!nameError || googleLoading}
        >
          Create Account
        </Button>
      </form>
    </div>
  )
}
