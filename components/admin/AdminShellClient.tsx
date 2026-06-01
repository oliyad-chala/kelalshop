'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import type { Profile } from '@/types/app.types'
import type { UserRole } from '@/types/database.types'
import type { AdminAlertCounts } from '@/lib/data/admin-alerts'

interface AdminShellClientProps {
  user: Profile
  userRole: UserRole
  alerts: AdminAlertCounts
  alertTotal: number
  children: React.ReactNode
}

export function AdminShellClient({
  user,
  userRole,
  alerts,
  alertTotal,
  children,
}: AdminShellClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

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
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div className={`admin-sidebar-wrapper${mobileOpen ? ' admin-sidebar-open' : ''}`}>
        <AdminSidebar
          user={user}
          userRole={userRole}
          alerts={alerts}
          alertTotal={alertTotal}
          onLinkClick={closeMenu}
        />
      </div>

      <main className="admin-main">
        <AdminHeader
          user={user}
          userRole={userRole}
          alertTotal={alertTotal}
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
