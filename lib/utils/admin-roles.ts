import type { UserRole } from '@/types/database.types'

export const ADMIN_PORTAL_ROLES = ['admin', 'staff'] as const
export type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number]

export function isAdminPortalRole(role: string | null | undefined): role is AdminPortalRole {
  return role === 'admin' || role === 'staff'
}

export function isAdminRole(role: string | null | undefined): role is 'admin' {
  return role === 'admin'
}

const ADMIN_ONLY_EXACT_PATHS = ['/admin/settings', '/admin/staff', '/admin/promotions/new', '/admin/disputes', '/admin/notifications']

export function isAdminOnlyPath(pathname: string): boolean {
  if (ADMIN_ONLY_EXACT_PATHS.includes(pathname)) return true
  // Block promotion detail/edit routes: /admin/promotions/[id]
  if (/^\/admin\/promotions\/[^/]+$/.test(pathname)) return true
  return false
}

export function portalRoleLabel(role: UserRole): string {
  return role === 'admin' ? 'Administrator' : role === 'staff' ? 'Staff' : role
}
