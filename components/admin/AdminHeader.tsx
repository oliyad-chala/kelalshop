'use client'

import { Bell, Settings, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { isAdminRole } from '@/lib/utils/admin-roles'
import type { UserRole } from '@/types/database.types'

interface AdminHeaderProps {
  user: { full_name?: string | null }
  userRole: UserRole
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export function AdminHeader({ user, userRole, onMenuToggle, isMobileMenuOpen }: AdminHeaderProps) {
  const isAdmin = isAdminRole(userRole)

  return (
    <header className="admin-top-header">
      {/* Hamburger (mobile only) */}
      <button
        className="admin-hamburger"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Search Bar Removed */}
      <div style={{ flex: 1 }} />

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-secondary)' }}>
          <Link href="/admin/settings" className="admin-header-icon-btn" title="Settings">
            <Settings size={20} color="currentColor" />
          </Link>
          <Link href="/admin/notifications" className="admin-header-icon-btn" style={{ position: 'relative', color: 'inherit' }} title="Notifications">
            <Bell size={20} color="currentColor" />
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '8px', height: '8px', background: 'var(--color-danger)',
              borderRadius: '50%', border: '2px solid var(--color-admin-surface)'
            }} />
          </Link>
        </div>
        )}

        {isAdmin && (
        <div style={{ width: '1px', height: '24px', background: 'var(--color-admin-border)' }} />
        )}

        {/* User Profile */}
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: 'var(--color-accent-500)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 700, flexShrink: 0, cursor: 'pointer'
        }}>
          {user?.full_name?.charAt(0).toUpperCase() ?? 'A'}
        </div>
      </div>
    </header>
  )
}
