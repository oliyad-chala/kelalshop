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
  | 'approve_payment'
  | 'reject_payment'
  | 'update_settings'
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

export interface LogAdminActionParams {
  adminId: string
  adminName: string
  actionType: ActionType
  entityType?: EntityType
  entityId?: string
  description: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
}

export async function logAdminAction(params: LogAdminActionParams) {
  try {
    const admin = createAdminClient()
    const headersList = await headers()

    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'

    await admin.from('activity_logs').insert({
      admin_id: params.adminId,
      admin_name: params.adminName,
      action_type: params.actionType,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      description: params.description,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
      ip_address: ip,
    })
  } catch (err) {
    // Logging should never crash the actual admin action
    console.error('[ActivityLog] Failed to log action:', err)
  }
}
