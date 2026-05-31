'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import type { Profile } from '@/types/app.types'

interface AdminShellClientProps {
  user: Profile
  pendingVerifications: number
  pendingPayments: number
  pendingCampaignReviews: number
  children: React.ReactNode
}

export function AdminShellClient({
  user,
  pendingVerifications,
  pendingPayments,
  pendingCampaignReviews,
  children,
}: AdminShellClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('admin-menu-open')
    } else {
      document.body.classList.remove('admin-menu-open')
    }
    return () => document.body.classList.remove('admin-menu-open')
  }, [mobileOpen])

  const closeMenu = () => setMobileOpen(false)
  const toggleMenu = () => setMobileOpen(o => !o)

  return (
    <div className="admin-shell">
      {/* Dark overlay — rendered BELOW sidebar in z-order but uses z-index 199 */}
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar wrapper: on desktop = normal flex child, on mobile = fixed offscreen */}
      <div className={`admin-sidebar-wrapper${mobileOpen ? ' admin-sidebar-open' : ''}`}>
        <AdminSidebar
          user={user}
          pendingVerifications={pendingVerifications}
          pendingPayments={pendingPayments}
          pendingCampaignReviews={pendingCampaignReviews}
          onLinkClick={closeMenu}
        />
      </div>

      {/* Main content — always takes remaining width */}
      <main className="admin-main">
        <AdminHeader
          user={user}
          onMenuToggle={toggleMenu}
          isMobileMenuOpen={mobileOpen}
        />
        <div className="admin-content fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
