'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShieldCheck,
  Wallet,
  Package,
  MessageSquareWarning,
  Star,
  LogOut,
  ChevronRight,
  Users,
} from 'lucide-react'
import { adminSignOut } from '@/lib/actions/admin-auth'
import type { Profile } from '@/types/app.types'
import { ThemeToggle } from '@/components/admin/ThemeToggle'

const navItems = [
  { href: '/admin/dashboard',      label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/admin/sellers',        label: 'Sellers',          icon: Users },
  { href: '/admin/verifications',  label: 'Verifications',    icon: ShieldCheck },
  { href: '/admin/payouts',        label: 'Pending Payments', icon: Wallet },
  { href: '/admin/products',       label: 'Products',         icon: Package },
  { href: '/admin/disputes',       label: 'Dispute Center',   icon: MessageSquareWarning },
  { href: '/admin/trust',          label: 'Trust Scores',     icon: Star },
]

export function AdminSidebar({ user }: { user: Profile }) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '240px',
      minHeight: '100dvh',
      background: 'var(--color-admin-surface)',
      borderRight: '1px solid var(--color-admin-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: '1px solid var(--color-admin-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '2.25rem', height: '2.25rem',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldCheck size={15} color="#ededed" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              KelalShop
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.08em', marginTop: '0.1rem' }}>
              ADMIN PORTAL
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 0.75rem',
                borderRadius: '7px',
                fontSize: '0.82rem',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                background: active ? 'var(--color-admin-hover)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
                position: 'relative',
              }}
            >
              <Icon
                size={15}
                style={{ color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)', flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{label}</span>
              {active && (
                <ChevronRight size={13} style={{ color: 'var(--color-text-muted)', opacity: 0.6 }} />
              )}
              {active && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: '2px', borderRadius: '0 2px 2px 0',
                  background: 'var(--color-text-primary)',
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Sign out */}
      <div style={{
        padding: '0.875rem 1rem',
        borderTop: '1px solid var(--color-admin-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.625rem' }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: '50%',
            background: '#1a1a1a',
            border: '1px solid #333',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)', flexShrink: 0,
          }}>
            {user.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.full_name ?? 'Admin'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Administrator</div>
          </div>
        </div>
        <form action={adminSignOut}>
          <button
            type="submit"
            className="admin-btn admin-btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </form>
        <ThemeToggle />
      </div>
    </aside>
  )
}
