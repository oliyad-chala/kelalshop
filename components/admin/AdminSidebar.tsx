'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  ChevronLeft,
  Megaphone,
  Bell,
  ClipboardList,
} from 'lucide-react'
import { adminSignOut } from '@/lib/actions/admin-auth'
import { isAdminRole, portalRoleLabel } from '@/lib/utils/admin-roles'
import type { AdminAlertCounts } from '@/lib/data/admin-alerts'
import type { Profile } from '@/types/app.types'
import type { UserRole } from '@/types/database.types'

const navItems = [
  { href: '/admin/dashboard',      label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/admin/sellers',        label: 'Sellers',          icon: Users },
  { href: '/admin/products',       label: 'Products',         icon: Package },
  { href: '/admin/orders',         label: 'Orders',           icon: ShoppingCart },
  { href: '/admin/verifications',  label: 'Verifications',    icon: ShieldCheck },
  { href: '/admin/payouts',        label: 'Payments',         icon: Wallet },
  { href: '/admin/disputes',       label: 'Disputes',         icon: MessageSquareWarning },
  { href: '/admin/trust',          label: 'Trust Scores',     icon: Star },
  { href: '/admin/promotions',     label: 'Marketing Center', icon: Megaphone },
]

const adminOnlyNavItems = [
  { href: '/admin/notifications',  label: 'Notifications',    icon: Bell },
  { href: '/admin/users',          label: 'Users',            icon: Users },
  { href: '/admin/staff',          label: 'Staff',            icon: ShieldCheck },
  { href: '/admin/activity-logs',  label: 'Activity Logs',    icon: ClipboardList },
  { href: '/admin/settings',       label: 'Settings',         icon: Settings },
]

function badgeForHref(href: string, alerts: AdminAlertCounts, alertTotal: number): number {
  if (href === '/admin/products') return alerts.pendingProducts
  if (href === '/admin/orders') return alerts.pendingOrders
  if (href === '/admin/verifications') return alerts.pendingVerifications
  if (href === '/admin/payouts') return alerts.pendingPayments
  if (href === '/admin/disputes') return alerts.openDisputes
  if (href === '/admin/promotions') return alerts.pendingCampaignReviews
  if (href === '/admin/notifications') return alertTotal
  return 0
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  count,
  isCollapsed,
  onLinkClick,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  active: boolean
  count: number
  isCollapsed: boolean
  onLinkClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onLinkClick}
      title={isCollapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: '0.85rem',
        padding: '0.7rem 1rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-text)',
        background: active ? 'var(--color-sidebar-active-bg)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
      {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{label}</span>}
      {!isCollapsed && count > 0 && (
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
      {isCollapsed && count > 0 && (
        <span style={{
          position: 'absolute', top: '4px', right: '4px',
          width: '8px', height: '8px',
          background: '#ff4d4f', borderRadius: '50%',
        }} />
      )}
    </Link>
  )
}

export function AdminSidebar({
  user,
  userRole,
  alerts,
  alertTotal = 0,
  onLinkClick,
}: {
  user: Profile
  userRole: UserRole
  alerts: AdminAlertCounts
  alertTotal?: number
  onLinkClick?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [signingOut, startSignOut] = useTransition()
  const isAdmin = isAdminRole(userRole)
  const bottomNavItems = isAdmin ? adminOnlyNavItems : []
  const visibleNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => item.href !== '/admin/disputes')

  const navPadding = isCollapsed ? '0.5rem 0.75rem' : '0.5rem 1rem'
  const footerPadding = isCollapsed ? '1rem 0.75rem' : '1rem'

  const handleSignOut = () => {
    startSignOut(async () => {
      try {
        await adminSignOut()
      } catch {
        router.push('/admin/login')
        router.refresh()
      }
    })
  }

  return (
    <aside
      className="admin-sidebar"
      style={{
        width: isCollapsed ? '72px' : '250px',
        background: 'var(--color-sidebar-bg)',
        color: 'var(--color-sidebar-text)',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="admin-sidebar-header"
        style={{ padding: isCollapsed ? '1rem 0' : '1.25rem 1.25rem' }}
      >
        {isCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem',
              background: 'linear-gradient(135deg, #5f63f2, #4a4eb8)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed((c) => !c)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              style={{
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', border: 'none',
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
                <ChevronLeft size={16} />
              </span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <div style={{
                width: '2.5rem', height: '2.5rem',
                background: 'linear-gradient(135deg, #5f63f2, #4a4eb8)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ShieldCheck size={20} color="#ffffff" />
              </div>
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>
                  KelalShop
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.2rem' }}>
                  ADMIN PANEL
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed((c) => !c)}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              style={{
                flexShrink: 0,
                width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', border: 'none',
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="admin-sidebar-scroll">
        <nav style={{ padding: navPadding, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {visibleNavItems.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))}
              count={badgeForHref(href, alerts, alertTotal)}
              isCollapsed={isCollapsed}
              onLinkClick={onLinkClick}
            />
          ))}
        </nav>

        {bottomNavItems.length > 0 && (
          <div style={{ padding: `0 ${isCollapsed ? '0.75rem' : '1rem'} 0.75rem` }}>
            {bottomNavItems.map(({ href, label, icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={pathname.startsWith(href)}
                count={badgeForHref(href, alerts, alertTotal)}
                isCollapsed={isCollapsed}
                onLinkClick={onLinkClick}
              />
            ))}
          </div>
        )}
      </div>

      <div className="admin-sidebar-footer" style={{ padding: footerPadding }}>
        {!isCollapsed && (
          <Link
            href="/admin/settings"
            onClick={onLinkClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
              padding: '0.35rem 0.25rem',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
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
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                {portalRoleLabel(userRole)}
              </div>
            </div>
          </Link>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          title={isCollapsed ? 'Sign out' : undefined}
          aria-label="Sign out"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.55rem',
            borderRadius: '6px',
            fontSize: '0.82rem',
            fontWeight: 500,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.6)',
            border: 'none',
            cursor: signingOut ? 'wait' : 'pointer',
            opacity: signingOut ? 0.7 : 1,
          }}
        >
          <LogOut size={14} />
          {!isCollapsed && (signingOut ? 'Signing out…' : 'Sign out')}
        </button>
      </div>
    </aside>
  )
}
