'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signInWithGoogle } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const initialState = { error: '', success: '' }

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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, formAction, pending] = useActionState(signIn, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')

  // Check for OAuth failure flag from the callback route
  const oauthFailed = searchParams.get('error') === 'oauth_failed'

  useEffect(() => {
    if (state?.success === 'true') {
      const raw = searchParams.get('redirectTo')
      const safe = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard'
      router.push(safe)
      router.refresh()
    }
  }, [state?.success, router, searchParams])

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setGoogleError('')
    try {
      const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
      const result = await signInWithGoogle(redirectTo)
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

  const displayError = state?.error || googleError || (oauthFailed ? 'Google sign-in failed. Please try again.' : '')

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

      {/* Google Sign-In */}
      <button
        id="google-signin-btn"
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
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or continue with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Email/Password form */}
      <form action={formAction} className="space-y-5">
        <div className="space-y-4">
          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-navy-900">
                Password
              </label>
              <Link href="/auth/reset" className="text-sm font-medium text-amber-500 hover:text-amber-600">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
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
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={pending}
          disabled={googleLoading}
        >
          Sign In
        </Button>
      </form>
    </div>
  )
}
