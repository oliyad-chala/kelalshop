import { ShieldCheck, Zap } from 'lucide-react'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export const metadata = {
  title: 'Admin Login',
}

export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-admin-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--color-admin-surface)',
        border: '1px solid var(--color-admin-border)',
        borderRadius: '14px',
        padding: '2.5rem 2rem',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.25rem', height: '3.25rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 0 32px rgba(99,102,241,0.35)',
          }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <h1 style={{
            fontSize: '1.2rem', fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em', margin: 0,
          }}>
            Admin Portal
          </h1>
          <p style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.35rem',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
          }}>
            <ShieldCheck size={12} style={{ color: 'var(--color-accent-400)' }} />
            Restricted access — authorised staff only
          </p>
        </div>

        {/* Form */}
        <AdminLoginForm />

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Not an admin?{' '}
          <a href="/" style={{ color: 'var(--color-accent-400)', textDecoration: 'none' }}>
            Return to shop →
          </a>
        </p>
      </div>
    </div>
  )
}
