'use client'

import { useState } from 'react'
import { Bell, Search, Settings, Menu, X } from 'lucide-react'
import Link from 'next/link'

interface AdminHeaderProps {
  user: any
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export function AdminHeader({ user, onMenuToggle, isMobileMenuOpen }: AdminHeaderProps) {
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

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--color-admin-bg)', padding: '0.4rem 0.75rem',
          borderRadius: '6px', border: '1px solid var(--color-admin-border)',
          width: '100%', maxWidth: '300px'
        }}>
          <Search size={14} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
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

        <div style={{ width: '1px', height: '24px', background: 'var(--color-admin-border)' }} />

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
