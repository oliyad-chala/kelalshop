import type { TelegramAdminRole } from './types'

export type AdminPermission =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'pending'
  | 'sellers'
  | 'users'
  | 'tickets'
  | 'search'
  | 'revenue'
  | 'analytics'
  | 'withdrawals'
  | 'staff'
  | 'security'
  | 'broadcast'
  | 'ai'

const STAFF_PERMISSIONS: AdminPermission[] = [
  'dashboard',
  'orders',
  'products',
  'pending',
  'sellers',
  'users',
  'tickets',
  'search',
  'ai',
]

const ADMIN_PERMISSIONS: AdminPermission[] = [
  ...STAFF_PERMISSIONS,
  'revenue',
  'analytics',
  'withdrawals',
  'staff',
  'security',
  'broadcast',
]

export function hasPermission(role: TelegramAdminRole | undefined, permission: AdminPermission): boolean {
  if (!role) return false
  if (role === 'admin') return ADMIN_PERMISSIONS.includes(permission)
  return STAFF_PERMISSIONS.includes(permission)
}

export function permissionDeniedMessage(chatId: number): string {
  return (
    `⛔ <b>Access Denied</b>\n\n` +
    `Your Telegram ID <code>${chatId}</code> is not registered as an approved admin.\n\n` +
    `Website admin accounts do not automatically get bot access. Ask a super-admin to add your chat ID to <code>telegram_admins</code>.`
  )
}

export function adminOnlyMessage(): string {
  return '⛔ This command requires <b>Super Admin</b> privileges.'
}
