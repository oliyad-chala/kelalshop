// Re-export for backwards compatibility with customer flows
export { getTelegramSupabase as supabase } from '../core/supabase-admin'
export { authMiddleware, requireAdminRole as requireAdmin } from './auth'
