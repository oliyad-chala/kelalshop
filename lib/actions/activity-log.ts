'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export type ActionType =
  | 'login'
  | 'logout'
  | 'create_product'
  | 'update_product'
  | 'delete_product'
  | 'approve_product'
  | 'reject_product'
  | 'approve_seller'
  | 'reject_seller'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'update_order_status'
  | 'create_order'
  | 'approve_payment'
  | 'reject_payment'
  | 'update_settings'
  | 'update_profile'
  | 'toggle_product_boost'
  | 'update_subscription'
  | 'toggle_top_shopper'

export type EntityType =
  | 'product'
  | 'seller'
  | 'user'
  | 'order'
  | 'payment'
  | 'settings'
  | 'subscription'
  | 'profile'

export interface LogUserActionParams {
  userId: string
  userName: string
  actionType: ActionType
  entityType?: EntityType
  entityId?: string
  description: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
}

// Keep the old interface name for backwards compatibility
export type LogAdminActionParams = Omit<LogUserActionParams, 'userId' | 'userName'> & {
  adminId?: string
  adminName?: string
  userId?: string
  userName?: string
}

export async function logUserAction(params: LogUserActionParams) {
  try {
    const admin = createAdminClient()
    const headersList = await headers()

    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'

    await admin.from('activity_logs').insert({
      admin_id: params.userId,
      admin_name: params.userName,
      action_type: params.actionType,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      description: params.description,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
      ip_address: ip,
    })
  } catch (err) {
    // Logging should never crash the actual user action
    console.error('[ActivityLog] Failed to log action:', err)
  }
}

// Alias to avoid breaking existing imports that use `logAdminAction`
export async function logAdminAction(params: LogAdminActionParams) {
  return logUserAction({
    ...params,
    userId: params.adminId ?? params.userId ?? 'unknown',
    userName: params.adminName ?? params.userName ?? 'Unknown',
  })
}
