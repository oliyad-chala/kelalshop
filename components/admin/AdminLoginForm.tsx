'use client'

import { useActionState } from 'react'
import { adminSignIn } from '@/lib/actions/admin-auth'

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(adminSignIn, null)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {state?.error && (
        <div style={{
          padding: '0.75rem',
          borderRadius: '6px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          fontSize: '0.8125rem'
        }}>
          {state.error}
        </div>
      )}

      <div>
        <label className="admin-label" htmlFor="admin-email">Email address</label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@kelalshop.com"
          className="admin-input"
        />
      </div>

      <div>
        <label className="admin-label" htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="admin-input"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="admin-btn admin-btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', marginTop: '0.5rem', fontSize: '0.875rem' }}
      >
        {isPending ? 'Signing in...' : 'Sign in to Admin Portal'}
      </button>
    </form>
  )
}
