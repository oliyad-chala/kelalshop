import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export const metadata = {
  title: 'Admin Login | KelalShop',
}

export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-admin-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--color-admin-surface)',
        border: '1px solid var(--color-admin-border)',
        borderRadius: '14px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem',
            background: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <ShieldCheck size={22} color="#ededed" />
          </div>
          <h1 style={{
            fontSize: '1.3rem', fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.025em', margin: 0,
          }}>
            Admin Portal
          </h1>
          <p style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.4rem',
          }}>
            KelalShop Control Center
          </p>
        </div>

        {/* Form */}
        <AdminLoginForm />

        {/* Monitoring Warning */}
        <div style={{
          marginTop: '1.75rem',
          padding: '0.875rem 1rem',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem',
        }}>
          <AlertTriangle size={13} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{
            fontSize: '0.72rem',
            color: '#71717a',
            margin: 0,
            lineHeight: 1.6,
          }}>
            This portal is <strong style={{ color: '#a1a1aa' }}>restricted to authorised administrators only</strong>.
            All access attempts are logged and monitored. Unauthorised access is prohibited.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Not an admin?{' '}
          <a href="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            Return to shop →
          </a>
        </p>
      </div>
    </div>
  )
}
