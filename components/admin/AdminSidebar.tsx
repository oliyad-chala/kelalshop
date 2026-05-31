'use client'

import { useState } from 'react'
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
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from 'lucide-react'
import { adminSignOut } from '@/lib/actions/admin-auth'
import { isAdminRole, portalRoleLabel } from '@/lib/utils/admin-roles'
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
  { href: '/admin/staff',          label: 'Staff',            icon: Users },
  { href: '/admin/settings',       label: 'Settings',         icon: Settings },
]

export function AdminSidebar({
  user,
  userRole,
  pendingVerifications = 0,
  pendingPayments = 0,
  pendingCampaignReviews = 0,
  onLinkClick,
}: {
  user: Profile
  userRole: UserRole
  pendingVerifications?: number
  pendingPayments?: number
  pendingCampaignReviews?: number
  onLinkClick?: () => void
}) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isAdmin = isAdminRole(userRole)
  const bottomNavItems = isAdmin ? adminOnlyNavItems : []
  const visibleNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => item.href !== '/admin/disputes')

  return (
    <aside style={{
      width: isCollapsed ? '72px' : '250px',
      minHeight: '100dvh',
      height: '100%',
      background: 'var(--color-sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      color: 'var(--color-sidebar-text)',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
    }}>
      {/* Logo + Toggle Row */}
      <div style={{
        padding: isCollapsed ? '1rem 0' : '1.25rem 1.25rem',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {isCollapsed ? (
          /* Collapsed: stack logo icon + toggle arrow vertically, centered */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem',
              background: 'linear-gradient(135deg, #5f63f2, #4a4eb8)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <button
              onClick={() => setIsCollapsed(c => !c)}
              title="Expand sidebar"
              style={{
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', border: 'none',
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'
              }}
            >
              <span style={{
                display: 'inline-flex',
                transform: 'rotate(180deg)',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <ChevronLeft size={16} />
              </span>
            </button>
          </div>
        ) : (
          /* Expanded: logo + text on left, arrow on right */
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
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1 }}>
                  KelalShop
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.2rem' }}>
                  ADMIN PANEL
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCollapsed(c => !c)}
              title="Collapse sidebar"
              style={{
                flexShrink: 0,
                width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', border: 'none',
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'
              }}
            >
              <span style={{
                display: 'inline-flex',
                transform: 'rotate(0deg)',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <ChevronLeft size={16} />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: isCollapsed ? '0.5rem 0.75rem' : '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))

          let count = 0
          if (href === '/admin/verifications') count = pendingVerifications
          if (href === '/admin/payouts') count = pendingPayments
          if (href === '/admin/promotions') count = pendingCampaignReviews

          return (
            <Link
              key={href}
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
              <Icon
                size={18}
                style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}
              />
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
        })}
      </nav>

      {/* Bottom nav — Settings */}
      <div style={{ padding: isCollapsed ? '0 0.75rem 0.5rem' : '0 1rem 0.5rem' }}>
        {bottomNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              title={isCollapsed ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '0.85rem',
                padding: '0.7rem 1rem', borderRadius: '8px',
                fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                color: active ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-text)',
                background: active ? 'var(--color-sidebar-active-bg)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
              {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </Link>
          )
        })}
      </div>

      {/* Sign out */}
      <div style={{
        padding: isCollapsed ? '1rem 0.75rem' : '1rem',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>

        {!isCollapsed && (
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
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{portalRoleLabel(userRole)}</div>
            </div>
          </div>
        )}
        <form action={adminSignOut}>
          <button
            type="submit"
            title={isCollapsed ? 'Sign out' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.5rem',
              padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500,
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <LogOut size={14} />
            {!isCollapsed && 'Sign out'}
          </button>
        </form>
      </div>
    </aside>
  )
}
