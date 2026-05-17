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
  Users,
  ShoppingCart,
  Settings,
} from 'lucide-react'
import { adminSignOut } from '@/lib/actions/admin-auth'
import type { Profile } from '@/types/app.types'

const navItems = [
  { href: '/admin/dashboard',      label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/admin/sellers',        label: 'Sellers',          icon: Users },
  { href: '/admin/products',       label: 'Products',         icon: Package },
  { href: '/admin/orders',         label: 'Orders',           icon: ShoppingCart },
  { href: '/admin/verifications',  label: 'Verifications',    icon: ShieldCheck },
  { href: '/admin/payouts',        label: 'Payments',         icon: Wallet },
  { href: '/admin/disputes',       label: 'Disputes',         icon: MessageSquareWarning },
  { href: '/admin/trust',          label: 'Trust Scores',     icon: Star },
]

const bottomNavItems = [
  { href: '/admin/settings',       label: 'Settings',         icon: Settings },
]

export function AdminSidebar({
  user,
  pendingVerifications = 0,
  pendingPayments = 0,
  onLinkClick,
}: {
  user: Profile
  pendingVerifications?: number
  pendingPayments?: number
  onLinkClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '250px',
      minHeight: '100dvh',
      height: '100%',
      background: 'var(--color-sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      color: 'var(--color-sidebar-text)',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem',
            background: 'linear-gradient(135deg, #5f63f2, #4a4eb8)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldCheck size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1 }}>
              KelalShop
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.2rem' }}>
              ADMIN PANEL
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))

          let count = 0
          if (href === '/admin/verifications') count = pendingVerifications
          if (href === '/admin/payouts') count = pendingPayments

          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.7rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-text)',
                background: active ? 'var(--color-sidebar-active-bg)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon
                size={18}
                style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}
              />
              <span style={{ flex: 1 }}>{label}</span>

              {count > 0 && (
                <span style={{
                  background: active ? 'rgba(255,255,255,0.2)' : '#ff4d4f',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '10px',
                  minWidth: '20px',
                  textAlign: 'center',
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav — Settings */}
      <div style={{ padding: '0 1rem 0.5rem' }}>
        {bottomNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.7rem 1rem', borderRadius: '8px',
                fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                color: active ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-text)',
                background: active ? 'var(--color-sidebar-active-bg)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>

      {/* Sign out */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #5f63f2, #a155e8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.full_name ?? 'Admin'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Administrator</div>
          </div>
        </div>
        <form action={adminSignOut}>
          <button
            type="submit"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500,
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
